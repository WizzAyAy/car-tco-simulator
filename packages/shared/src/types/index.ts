export type Energy = 'gasoline' | 'diesel' | 'hybrid' | 'phev' | 'electric'

export type VehicleCategory =
  | 'cityCar'
  | 'compact'
  | 'sedan'
  | 'estate'
  | 'suv'
  | 'utility'

export type InsuranceTier = 'thirdParty' | 'thirdPartyPlus' | 'comprehensive'

export interface TripMix {
  urban: number
  road: number
  highway: number
}

export interface ChargeMix {
  home: number
  fastStation: number
}

export interface Vehicle {
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
  /** True for fictional segment representatives derived from the real catalog (see archetypes.ts) */
  isArchetype?: boolean
}

export interface DriverProfile {
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

export type AcquisitionMode = 'cash' | 'credit' | 'leasing'

export interface LeasingConfig {
  /** Upfront "premier loyer majoré" / apport paid in year 1 */
  initialDeposit: number
  monthlyRent: number
  termMonths: number
  /** Contractual annual mileage cap (forfait km) */
  mileageCapPerYear: number
  /** Per-km charge applied to mileage driven above the cap */
  overageCostPerKm: number
  /** LOA buyback option (option d'achat); false models a pure LLD */
  buyOption: boolean
  /** Residual buyback price paid at the end of the term if buyOption is exercised */
  buyOptionPrice: number
}

export interface TCOInput {
  vehicle: Vehicle
  profile: DriverProfile
  durationYears: number
  purchaseCondition: PurchaseCondition
  /**
   * Acquisition mode. Optional for backward compatibility: when omitted it is
   * derived from `financing.enabled` (true → 'credit', false → 'cash').
   */
  acquisitionMode?: AcquisitionMode
  financing: {
    enabled: boolean
    downPayment: number
    aprPercent: number
    termYears: number
  }
  /** Leasing (LOA/LLD) configuration, used only when acquisitionMode === 'leasing' */
  leasing?: LeasingConfig
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
  | 'leasing'
  | 'depreciation'
  | 'carbon'

export interface YearlyBreakdown {
  year: number
  age: number
  costs: Record<CostCategory, number>
  total: number
  cumulative: number
}

export interface TCOResult {
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

export interface ComparisonResult {
  a: TCOResult
  b: TCOResult
  winner: 'a' | 'b' | 'tie'
  savings: number
  savingsPercent: number
  breakEvenYear: number | null
}
