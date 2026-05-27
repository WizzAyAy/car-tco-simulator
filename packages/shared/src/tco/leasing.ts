import type { LeasingConfig } from '../types'

export interface LeasingPlan {
  initialDeposit: number
  monthlyRent: number
  termMonths: number
  /** Whole years covered by the lease (rents are billed within these years) */
  termYears: number
  /** Total rents over the full term (excludes deposit and overage) */
  totalRents: number
  /** Deposit + total rents (excludes mileage overage and buyback) */
  totalLeasingCost: number
  buyOption: boolean
  buyOptionPrice: number
}

export function computeLeasing(config: LeasingConfig): LeasingPlan {
  const termMonths = Math.max(1, Math.round(config.termMonths))
  const monthlyRent = Math.max(0, config.monthlyRent)
  const initialDeposit = Math.max(0, config.initialDeposit)
  const totalRents = monthlyRent * termMonths
  const buyOptionPrice = config.buyOption ? Math.max(0, config.buyOptionPrice) : 0

  return {
    initialDeposit,
    monthlyRent,
    termMonths,
    termYears: Math.ceil(termMonths / 12),
    totalRents,
    totalLeasingCost: initialDeposit + totalRents,
    buyOption: config.buyOption,
    buyOptionPrice,
  }
}

/**
 * Number of leasing rent months that fall within a given holding year.
 * Year 1 covers months 1..12, year 2 months 13..24, etc. The lease may end
 * mid-year, so the final year can carry fewer than 12 rents.
 */
export function rentMonthsInYear(year: number, termMonths: number): number {
  const start = (year - 1) * 12
  if (start >= termMonths)
    return 0
  return Math.min(12, termMonths - start)
}

/**
 * Mileage overage charge for one year: kilometres driven above the contractual
 * cap are billed at `overageCostPerKm`. Returns 0 when within the forfait.
 */
export function mileageOveragePerYear(
  annualKm: number,
  mileageCapPerYear: number,
  overageCostPerKm: number,
): number {
  const excess = Math.max(0, annualKm - mileageCapPerYear)
  return excess * overageCostPerKm
}
