import type { LeasingConfig } from '../src/types'
import { describe, expect, it } from 'vitest'
import { buildDefaultInput } from '../src/defaults'
import { computeTCO } from '../src/tco'
import { findPresetById } from '../src/vehicles'

const baseLeasing: LeasingConfig = {
  initialDeposit: 3000,
  monthlyRent: 300,
  termMonths: 48,
  mileageCapPerYear: 15000,
  overageCostPerKm: 0.15,
  buyOption: false,
  buyOptionPrice: 0,
}

describe('leasing acquisition mode', () => {
  it('basic LLD: leasing category holds deposit + rents, depreciation and residual are zero', () => {
    const clio = findPresetById('clio-essence')!
    const input = buildDefaultInput(clio, {
      durationYears: 4,
      acquisitionMode: 'leasing',
      leasing: baseLeasing,
    })
    const result = computeTCO(input)

    // 4 years × 12 × 300 + 3000 deposit = 17400 within the leasing category
    expect(result.byCategory.leasing).toBeCloseTo(48 * 300 + 3000, 0)
    expect(result.byCategory.depreciation).toBe(0)
    expect(result.residualValue).toBe(0)
    // No registration or malus billed under leasing
    expect(result.byCategory.registration).toBe(0)
    expect(result.byCategory.malus).toBe(0)
    // Year 1 carries the deposit; year 2 does not
    expect(result.byYear[0]!.costs.leasing).toBeCloseTo(3000 + 12 * 300, 0)
    expect(result.byYear[1]!.costs.leasing).toBeCloseTo(12 * 300, 0)
  })

  it('lOA with buyback: option price is paid in the final lease year and booked as residual', () => {
    const clio = findPresetById('clio-essence')!
    const leasing: LeasingConfig = { ...baseLeasing, buyOption: true, buyOptionPrice: 8000 }
    const input = buildDefaultInput(clio, {
      durationYears: 4,
      acquisitionMode: 'leasing',
      leasing,
    })
    const result = computeTCO(input)

    const noBuy = computeTCO(buildDefaultInput(clio, {
      durationYears: 4,
      acquisitionMode: 'leasing',
      leasing: baseLeasing,
    }))

    // The buyback adds exactly buyOptionPrice to the leasing category in the last year.
    expect(result.byCategory.leasing - noBuy.byCategory.leasing).toBeCloseTo(8000, 0)
    expect(result.byYear[3]!.costs.leasing - noBuy.byYear[3]!.costs.leasing).toBeCloseTo(8000, 0)
    // Conservative residual: equals the fairly-priced option, depreciation stays zero.
    expect(result.residualValue).toBe(8000)
    expect(result.byCategory.depreciation).toBe(0)
  })

  it('mileage overage: driving above the cap adds per-km charges to the leasing category', () => {
    const clio = findPresetById('clio-essence')!
    const withinCap = buildDefaultInput(clio, {
      durationYears: 3,
      acquisitionMode: 'leasing',
      leasing: baseLeasing,
    })
    withinCap.profile = { ...withinCap.profile, annualKm: 15000 }

    const overCap = buildDefaultInput(clio, {
      durationYears: 3,
      acquisitionMode: 'leasing',
      leasing: baseLeasing,
    })
    overCap.profile = { ...overCap.profile, annualKm: 25000 }

    const within = computeTCO(withinCap)
    const over = computeTCO(overCap)

    // 10000 excess km × 0.15 × 3 years = 4500 extra in the leasing category
    expect(over.byCategory.leasing - within.byCategory.leasing).toBeCloseTo(10000 * 0.15 * 3, 0)
  })

  it('leasing vs cash sanity: leasing skips upfront purchase, so depreciation differs structurally', () => {
    const clio = findPresetById('clio-essence')!
    const cash = computeTCO(buildDefaultInput(clio, { durationYears: 4 }))
    const lease = computeTCO(buildDefaultInput(clio, {
      durationYears: 4,
      acquisitionMode: 'leasing',
      leasing: baseLeasing,
    }))

    // Cash buyer eats depreciation; lessee has none.
    expect(cash.byCategory.depreciation).toBeGreaterThan(0)
    expect(lease.byCategory.depreciation).toBe(0)
    // Cash buyer has no leasing line; lessee has a substantial one.
    expect(cash.byCategory.leasing).toBe(0)
    expect(lease.byCategory.leasing).toBeGreaterThan(0)
    // Shared running costs (energy) are identical regardless of acquisition mode.
    expect(lease.byCategory.energy).toBeCloseTo(cash.byCategory.energy, 0)
    // category totals still reconcile with the reported total cost
    const sum = Object.values(lease.byCategory).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(lease.totalCost, -1)
  })

  it('term shorter than holding period: rents stop once the lease ends', () => {
    const clio = findPresetById('clio-essence')!
    const leasing: LeasingConfig = { ...baseLeasing, termMonths: 36 }
    const result = computeTCO(buildDefaultInput(clio, {
      durationYears: 5,
      acquisitionMode: 'leasing',
      leasing,
    }))

    // Only 36 months of rent are billed even over a 5-year horizon
    expect(result.byCategory.leasing).toBeCloseTo(36 * 300 + 3000, 0)
    expect(result.byYear[3]!.costs.leasing).toBe(0)
    expect(result.byYear[4]!.costs.leasing).toBe(0)
  })
})
