import type {
  AcquisitionMode,
  CostCategory,
  DriverProfile,
  TCOInput,
  TCOResult,
  Vehicle,
  YearlyBreakdown,
} from '../types'
import { PRIOR_YEARS_BY_CONDITION } from '../types'
import { relativeResidualFactor } from './depreciation'
import { energyCostPerYear } from './energy'
import { computeFinancing } from './financing'
import { insurancePerYear } from './insurance'
import { computeLeasing, mileageOveragePerYear, rentMonthsInYear } from './leasing'

const EMPTY_COSTS: Record<CostCategory, number> = {
  energy: 0,
  maintenance: 0,
  tires: 0,
  consumables: 0,
  insurance: 0,
  controlTechnique: 0,
  parking: 0,
  registration: 0,
  malus: 0,
  repairs: 0,
  financing: 0,
  leasing: 0,
  depreciation: 0,
  carbon: 0,
}

function resolveAcquisitionMode(input: TCOInput): AcquisitionMode {
  if (input.acquisitionMode)
    return input.acquisitionMode
  return input.financing.enabled ? 'credit' : 'cash'
}

function ageMaintenanceMultiplier(carAge: number): number {
  if (carAge <= 3)
    return 1.0
  if (carAge <= 6)
    return 1.15
  if (carAge <= 9)
    return 1.35
  return 1.55
}

function repairProvision(carAge: number, isElectric: boolean): number {
  let base: number
  if (carAge <= 3)
    base = 100
  else if (carAge <= 6)
    base = 320
  else if (carAge <= 9)
    base = 620
  else base = 950
  return isElectric ? base * 0.55 : base
}

function consumablesPerYear(): number {
  return 90
}

function controlTechniquePerYear(carAge: number): number {
  if (carAge < 4)
    return 0
  return ((carAge - 4) % 2 === 0) ? 88 : 0
}

function parkingPerYear(profile: DriverProfile): number {
  if (profile.parkingType === 'paidParking')
    return profile.paidParkingMonthly * 12
  return 0
}

function registrationFirstYear(vehicle: Vehicle, isUsed: boolean): number {
  if (isUsed)
    return 75
  if (vehicle.energy === 'electric')
    return 13.76
  const fiscalHorsepower = Math.max(3, Math.round(vehicle.curbWeight / 250))
  return Math.round(11 + fiscalHorsepower * 43)
}

function tiresPerYear(vehicle: Vehicle, profile: DriverProfile): number {
  const sets = profile.annualKm / vehicle.tireLifeKm
  return sets * vehicle.tireSetPrice
}

export function computeTCO(input: TCOInput): TCOResult {
  const { vehicle, profile, durationYears, financing, leasing, includeCarbonExternality, carbonPricePerTon } = input
  const mode = resolveAcquisitionMode(input)
  const isLeasing = mode === 'leasing'
  const priorYears = PRIOR_YEARS_BY_CONDITION[input.purchaseCondition]
  const isUsed = priorYears > 0
  const inflation = 1 + input.inflationPercent / 100
  const energyInflation = 1 + input.energyInflationPercent / 100

  const financingPlan = mode === 'credit' && financing.enabled
    ? computeFinancing({
        purchasePrice: vehicle.purchasePrice,
        downPayment: financing.downPayment,
        aprPercent: financing.aprPercent,
        termYears: financing.termYears,
      })
    : null

  const leasingPlan = isLeasing && leasing ? computeLeasing(leasing) : null

  let cumulative = 0
  let totalCo2Kg = 0

  const byCategory: Record<CostCategory, number> = { ...EMPTY_COSTS }
  const byYear: YearlyBreakdown[] = []

  const effectivePurchase = vehicle.purchasePrice
  let prevResidual = effectivePurchase

  for (let year = 1; year <= durationYears; year++) {
    const carAge = priorYears + year
    const inflationFactor = inflation ** (year - 1)
    const energyInflationFactor = energyInflation ** (year - 1)

    const energy = energyCostPerYear(vehicle, profile, energyInflationFactor)
    const insurance = insurancePerYear(vehicle, profile, inflationFactor) * (isUsed ? 0.92 : 1)
    const tires = tiresPerYear(vehicle, profile) * inflationFactor
    const maintenance = vehicle.maintenanceAnnual * ageMaintenanceMultiplier(carAge) * inflationFactor
    const consumables = consumablesPerYear() * inflationFactor
    const controlTechnique = controlTechniquePerYear(carAge) * inflationFactor
    const parking = parkingPerYear(profile) * inflationFactor
    // Leasing rents typically bundle registration and any malus, so default them to 0.
    const registration = !isLeasing && year === 1 ? registrationFirstYear(vehicle, isUsed) : 0
    const malus = !isLeasing && year === 1 ? vehicle.malus - vehicle.bonus : 0
    const repairs = repairProvision(carAge, vehicle.energy === 'electric') * inflationFactor

    const financingTermYears = financingPlan ? Math.ceil(financingPlan.termMonths / 12) : 0
    const financingThisYear = financingPlan && year <= financingTermYears
      ? financingPlan.totalInterest / financingTermYears
      : 0

    let leasingThisYear = 0
    if (leasingPlan) {
      const rents = rentMonthsInYear(year, leasingPlan.termMonths) * leasingPlan.monthlyRent
      const deposit = year === 1 ? leasingPlan.initialDeposit : 0
      const overage = mileageOveragePerYear(
        profile.annualKm,
        leasing!.mileageCapPerYear,
        leasing!.overageCostPerKm,
      )
      const isLastLeaseYear = year === Math.min(durationYears, leasingPlan.termYears)
      const buyback = leasingPlan.buyOption && isLastLeaseYear ? leasingPlan.buyOptionPrice : 0
      leasingThisYear = deposit + rents + overage + buyback
    }

    // Owned vehicles depreciate; leased vehicles do not (the user never owns the asset).
    const relativeFactor = relativeResidualFactor(year, priorYears, vehicle.energy, vehicle.category)
    const currentResidual = isLeasing ? prevResidual : effectivePurchase * relativeFactor
    const depreciation = isLeasing ? 0 : Math.max(0, prevResidual - currentResidual)
    prevResidual = currentResidual

    const carbonKg = energy.co2Kg
    totalCo2Kg += carbonKg
    const carbonCost = includeCarbonExternality ? (carbonKg / 1000) * carbonPricePerTon : 0

    const costs: Record<CostCategory, number> = {
      energy: energy.cost,
      maintenance,
      tires,
      consumables,
      insurance,
      controlTechnique,
      parking,
      registration,
      malus,
      repairs,
      financing: financingThisYear,
      leasing: leasingThisYear,
      depreciation,
      carbon: carbonCost,
    }

    let total = 0
    for (const key of Object.keys(costs) as CostCategory[]) {
      total += costs[key]
      byCategory[key] += costs[key]
    }

    cumulative += total

    byYear.push({
      year,
      age: year,
      costs,
      total,
      cumulative,
    })
  }

  const totalCost = cumulative
  // Cash/credit: depreciation is the true loss (purchase − final residual).
  // Leasing: the user never owned the car. With a buyback option exercised, the
  // residual equals the option price already paid (the option is assumed fairly
  // priced), so the net depreciation impact is zero — conservative, no equity windfall.
  if (!isLeasing)
    byCategory.depreciation = effectivePurchase - prevResidual
  const residualValue = isLeasing
    ? (leasingPlan?.buyOption ? leasingPlan.buyOptionPrice : 0)
    : prevResidual

  const totalMonths = durationYears * 12
  const monthlyEquivalent = totalCost / totalMonths
  const perKilometer = totalCost / (profile.annualKm * durationYears)

  return {
    vehicleId: vehicle.id,
    vehicleLabel: vehicle.label,
    durationYears,
    totalCost,
    monthlyEquivalent,
    perKilometer,
    residualValue,
    byCategory,
    byYear,
    co2EmittedKg: totalCo2Kg,
  }
}

export function compareTCO(a: TCOResult, b: TCOResult): {
  winner: 'a' | 'b' | 'tie'
  savings: number
  savingsPercent: number
  breakEvenYear: number | null
} {
  const diff = a.totalCost - b.totalCost
  const winner = Math.abs(diff) < 100 ? 'tie' : diff > 0 ? 'b' : 'a'
  const savings = Math.abs(diff)
  const savingsPercent = (savings / Math.max(a.totalCost, b.totalCost)) * 100

  let breakEvenYear: number | null = null
  const minLen = Math.min(a.byYear.length, b.byYear.length)
  for (let i = 0; i < minLen; i++) {
    const aYear = a.byYear[i]
    const bYear = b.byYear[i]
    if (!aYear || !bYear)
      continue
    const aCum = aYear.cumulative
    const bCum = bYear.cumulative
    if (i === 0) {
      if ((winner === 'a' && aCum < bCum) || (winner === 'b' && bCum < aCum)) {
        breakEvenYear = 1
        break
      }
      continue
    }
    const prevA = a.byYear[i - 1]?.cumulative ?? 0
    const prevB = b.byYear[i - 1]?.cumulative ?? 0
    const prevDiff = prevA - prevB
    const currentDiff = aCum - bCum
    if (Math.sign(prevDiff) !== Math.sign(currentDiff) && Math.sign(currentDiff) !== 0) {
      breakEvenYear = i + 1
      break
    }
  }

  return { winner, savings, savingsPercent, breakEvenYear }
}
