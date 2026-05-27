export type Energy = 'gasoline' | 'diesel' | 'hybrid' | 'phev' | 'electric'

export type VehicleCategory =
  | 'cityCar'
  | 'compact'
  | 'sedan'
  | 'estate'
  | 'suv'
  | 'utility'

export type InsuranceTier = 'thirdParty' | 'thirdPartyPlus' | 'comprehensive'

export type TripMix = {
  urban: number
  road: number
  highway: number
}

export type ChargeMix = {
  home: number
  fastStation: number
}

export type Vehicle = {
  id: string
  label: string
  /** Brand for external listing search (e.g. "Renault", "Peugeot", "Tesla") */
  brand: string
  /** Short model name for external listing search (e.g. "Clio", "208", "Model 3") */
  searchModel: string
  category: VehicleCategory
  energy: Energy
  purchasePrice: number
  consumption: number
  co2: number
  insuranceCategory: number
  maintenanceAnnual: number
  tireLifeKm: number
  tireSetPrice: number
  malus: number
  bonus: number
  curbWeight: number
  releaseYear: number
  /** WLTP range in km — for electric/PHEV only (electric-only range for PHEVs) */
  wltpRangeKm?: number
}

export type DriverProfile = {
  annualKm: number
  tripMix: TripMix
  region: string
  driverAge: number
  bonusMalus: number
  parkingType: 'garage' | 'street' | 'paidParking'
  paidParkingMonthly: number
  hasHomeCharging: boolean
  homeChargingMix: ChargeMix
  electricityHomePricePerKwh: number
  electricityFastPricePerKwh: number
  gasolinePricePerLiter: number
  dieselPricePerLiter: number
  insuranceTier: InsuranceTier
  insurancePerYearOverride: number | null
}

export type PurchaseCondition = 'new' | 'usedRecent' | 'usedOld'

export type TCOInput = {
  vehicle: Vehicle
  profile: DriverProfile
  durationYears: number
  purchaseCondition: PurchaseCondition
  financing: {
    enabled: boolean
    downPayment: number
    aprPercent: number
    termYears: number
  }
  includeCarbonExternality: boolean
  carbonPricePerTon: number
  inflationPercent: number
  energyInflationPercent: number
}

export const PRIOR_YEARS_BY_CONDITION: Record<PurchaseCondition, number> = {
  new: 0,
  usedRecent: 3,
  usedOld: 6,
}

export const CATEGORY_LABELS_FR: Record<VehicleCategory, string> = {
  cityCar: 'Citadine',
  compact: 'Compacte',
  sedan: 'Berline',
  estate: 'Break',
  suv: 'SUV',
  utility: 'Utilitaire familial',
}

export const CATEGORY_ORDER: readonly VehicleCategory[] = [
  'cityCar',
  'compact',
  'sedan',
  'estate',
  'suv',
  'utility',
] as const

export type CostCategory =
  | 'energy'
  | 'maintenance'
  | 'tires'
  | 'consumables'
  | 'insurance'
  | 'controlTechnique'
  | 'parking'
  | 'registration'
  | 'malus'
  | 'repairs'
  | 'financing'
  | 'depreciation'
  | 'carbon'

export type YearlyBreakdown = {
  year: number
  age: number
  costs: Record<CostCategory, number>
  total: number
  cumulative: number
}

export type TCOResult = {
  vehicleId: string
  vehicleLabel: string
  durationYears: number
  totalCost: number
  monthlyEquivalent: number
  perKilometer: number
  residualValue: number
  byCategory: Record<CostCategory, number>
  byYear: YearlyBreakdown[]
  co2EmittedKg: number
}

export type ComparisonResult = {
  a: TCOResult
  b: TCOResult
  winner: 'a' | 'b' | 'tie'
  savings: number
  savingsPercent: number
  breakEvenYear: number | null
}
