import type { DriverProfile, InsuranceTier, Vehicle } from '../types'

const TIER_BASE: Record<InsuranceTier, number> = {
  thirdParty: 380,
  thirdPartyPlus: 580,
  comprehensive: 850,
}

export function insurancePerYear(
  vehicle: Vehicle,
  profile: DriverProfile,
  inflationFactor: number,
): number {
  if (profile.insurancePerYearOverride !== null && profile.insurancePerYearOverride > 0) {
    return profile.insurancePerYearOverride * inflationFactor
  }

  const base = TIER_BASE[profile.insuranceTier]
  const categoryFactor = 1 + (vehicle.insuranceCategory - 12) * 0.06
  const bonusFactor = profile.bonusMalus
  const ageFactor = profile.driverAge < 25 ? 1.35 : profile.driverAge < 30 ? 1.1 : 1.0

  return base * Math.max(0.5, categoryFactor) * bonusFactor * ageFactor * inflationFactor
}
