import type { DriverProfile, LeasingConfig, PurchaseCondition, TCOInput, Vehicle } from './types'
import { residualValue } from './tco/depreciation'
import { PRIOR_YEARS_BY_CONDITION } from './types'

export const DEFAULT_LEASING: LeasingConfig = {
  initialDeposit: 3000,
  monthlyRent: 350,
  termMonths: 48,
  mileageCapPerYear: 15000,
  overageCostPerKm: 0.15,
  buyOption: true,
  buyOptionPrice: 8000,
}

export const DEFAULT_PROFILE: DriverProfile = {
  annualKm: 15000,
  tripMix: { urban: 0.45, road: 0.35, highway: 0.2 },
  region: 'ile-de-france',
  driverAge: 38,
  bonusMalus: 0.5,
  parkingType: 'street',
  paidParkingMonthly: 0,
  hasHomeCharging: true,
  homeChargingMix: { home: 0.85, fastStation: 0.15 },
  electricityHomePricePerKwh: 0.2516,
  electricityFastPricePerKwh: 0.49,
  gasolinePricePerLiter: 2.02,
  dieselPricePerLiter: 1.92,
  insuranceTier: 'thirdPartyPlus',
  insurancePerYearOverride: null,
}

export function buildDefaultInput(vehicle: Vehicle, overrides?: Partial<TCOInput>): TCOInput {
  return {
    vehicle,
    profile: DEFAULT_PROFILE,
    durationYears: 5,
    purchaseCondition: 'new',
    financing: {
      enabled: false,
      downPayment: 0,
      aprPercent: 4.5,
      termYears: 5,
    },
    leasing: DEFAULT_LEASING,
    includeCarbonExternality: false,
    carbonPricePerTon: 90,
    inflationPercent: 2.0,
    energyInflationPercent: 3.0,
    ...overrides,
  }
}

export function estimateUsedPrice(vehicle: Vehicle, condition: PurchaseCondition): number {
  const priorYears = PRIOR_YEARS_BY_CONDITION[condition]
  if (priorYears === 0)
    return vehicle.purchasePrice
  return residualValue(vehicle.purchasePrice, priorYears, vehicle.energy, vehicle.category)
}
