import { describe, expect, it } from 'vitest'
import { buildDefaultInput, estimateUsedPrice } from '../src/defaults'
import { compareTCO, computeTCO } from '../src/tco'
import { findPresetById } from '../src/vehicles'

describe('computeTCO', () => {
  it('produces a year-by-year breakdown matching durationYears', () => {
    const clio = findPresetById('clio-essence')!
    const input = buildDefaultInput(clio, { durationYears: 5 })
    const result = computeTCO(input)

    expect(result.byYear).toHaveLength(5)
    expect(result.byYear[0]?.year).toBe(1)
    expect(result.byYear[4]?.year).toBe(5)
  })

  it('total cost equals sum of yearly totals (depreciation captures purchase)', () => {
    const clio = findPresetById('clio-essence')!
    const input = buildDefaultInput(clio, { durationYears: 5 })
    const result = computeTCO(input)

    const sumYearly = result.byYear.reduce((acc, y) => acc + y.total, 0)
    expect(result.totalCost).toBeCloseTo(sumYearly, 0)
  })

  it('electric vehicle has zero direct CO2 emissions per km (grid only)', () => {
    const zoe = findPresetById('zoe-electric')!
    const input = buildDefaultInput(zoe, { durationYears: 5 })
    const result = computeTCO(input)
    // EV CO2 comes only from grid, so total should be much lower than equivalent thermal
    expect(result.co2EmittedKg).toBeLessThan(2500)
  })

  it('residual value decreases monotonically over time', () => {
    const clio = findPresetById('clio-essence')!
    const yearOne = computeTCO(buildDefaultInput(clio, { durationYears: 1 }))
    const yearFive = computeTCO(buildDefaultInput(clio, { durationYears: 5 }))
    const yearTen = computeTCO(buildDefaultInput(clio, { durationYears: 10 }))

    expect(yearOne.residualValue).toBeGreaterThan(yearFive.residualValue)
    expect(yearFive.residualValue).toBeGreaterThan(yearTen.residualValue)
  })

  it('insurance override is respected', () => {
    const clio = findPresetById('clio-essence')!
    const input = buildDefaultInput(clio, { durationYears: 1 })
    input.profile = { ...input.profile, insurancePerYearOverride: 1000 }
    const result = computeTCO(input)

    expect(result.byYear[0]?.costs.insurance).toBe(1000)
  })

  it('EV running costs (excluding depreciation) are lower than diesel at high mileage', () => {
    const e208 = findPresetById('e208-electric')!
    const clioDiesel = findPresetById('clio-diesel')!
    const profile = {
      ...buildDefaultInput(e208).profile,
      annualKm: 25000,
    }
    const evResult = computeTCO({
      ...buildDefaultInput(e208, { durationYears: 5 }),
      profile,
    })
    const dieselResult = computeTCO({
      ...buildDefaultInput(clioDiesel, { durationYears: 5 }),
      profile,
    })

    const evRunning = evResult.byCategory.energy + evResult.byCategory.maintenance + evResult.byCategory.repairs
    const dieselRunning = dieselResult.byCategory.energy + dieselResult.byCategory.maintenance + dieselResult.byCategory.repairs
    expect(evRunning).toBeLessThan(dieselRunning)
  })

  it('compareTCO declares winner correctly', () => {
    const clio = findPresetById('clio-essence')!
    const passat = findPresetById('passat-sw-diesel')!
    const a = computeTCO(buildDefaultInput(clio, { durationYears: 5 }))
    const b = computeTCO(buildDefaultInput(passat, { durationYears: 5 }))

    const cmp = compareTCO(a, b)
    expect(cmp.winner).toBe('a')
    expect(cmp.savings).toBeGreaterThan(0)
    expect(cmp.savingsPercent).toBeGreaterThan(0)
  })

  it('financing adds interest over cash purchase', () => {
    const tigan = findPresetById('tiguan-essence')!
    const cash = computeTCO(buildDefaultInput(tigan, { durationYears: 5 }))
    const loan = computeTCO(buildDefaultInput(tigan, {
      durationYears: 5,
      financing: { enabled: true, downPayment: 5000, aprPercent: 5.5, termYears: 5 },
    }))

    expect(loan.totalCost).toBeGreaterThan(cash.totalCost)
  })

  it('per-kilometer cost is non-zero and sensible', () => {
    const clio = findPresetById('clio-essence')!
    const result = computeTCO(buildDefaultInput(clio, { durationYears: 5 }))
    expect(result.perKilometer).toBeGreaterThan(0.2)
    expect(result.perKilometer).toBeLessThan(2)
  })

  it('category totals sum to total cost (within rounding)', () => {
    const modely = findPresetById('modely-electric')!
    const result = computeTCO(buildDefaultInput(modely, { durationYears: 5 }))
    const sumCategories = Object.values(result.byCategory).reduce((a, b) => a + b, 0)
    expect(sumCategories).toBeCloseTo(result.totalCost, -1)
  })

  it('used vehicle has lower total cost than new vehicle (cheaper entry)', () => {
    const zoe = findPresetById('zoe-electric')!
    const used = zoe
    const usedInput = buildDefaultInput(used, { durationYears: 5, purchaseCondition: 'usedRecent' })
    usedInput.vehicle = { ...used, purchasePrice: estimateUsedPrice(used, 'usedRecent') }
    const newResult = computeTCO(buildDefaultInput(used, { durationYears: 5 }))
    const usedResult = computeTCO(usedInput)
    expect(usedResult.totalCost).toBeLessThan(newResult.totalCost)
  })

  it('eco bonus on a vehicle is applied year-1 regardless of new/used (user-controlled)', () => {
    const zoe = findPresetById('zoe-electric')!
    const usedInput = buildDefaultInput(zoe, { durationYears: 1, purchaseCondition: 'usedRecent' })
    // Simulate a used VE eligible to a 1000€ "prime à la conversion" subsidy
    usedInput.vehicle = {
      ...zoe,
      purchasePrice: estimateUsedPrice(zoe, 'usedRecent'),
      bonus: 1000,
      malus: 0,
    }
    const result = computeTCO(usedInput)
    expect(result.byYear[0]?.costs.malus).toBe(-1000)
  })

  it('used vehicle has higher maintenance multiplier (older car)', () => {
    const clio = findPresetById('clio-essence')!
    const usedInput = buildDefaultInput(clio, { durationYears: 1, purchaseCondition: 'usedOld' })
    usedInput.vehicle = { ...clio, purchasePrice: estimateUsedPrice(clio, 'usedOld') }
    const usedResult = computeTCO(usedInput)
    const newResult = computeTCO(buildDefaultInput(clio, { durationYears: 1 }))
    expect(usedResult.byYear[0]!.costs.maintenance).toBeGreaterThan(newResult.byYear[0]!.costs.maintenance)
  })

  it('used Zoé becomes much cheaper per km than new Clio essence (the insight)', () => {
    const zoe = findPresetById('zoe-electric')!
    const clio = findPresetById('clio-essence')!
    const zoeUsed = buildDefaultInput(zoe, { durationYears: 5, purchaseCondition: 'usedRecent' })
    zoeUsed.vehicle = { ...zoe, purchasePrice: estimateUsedPrice(zoe, 'usedRecent') }
    const zoeResult = computeTCO(zoeUsed)
    const clioResult = computeTCO(buildDefaultInput(clio, { durationYears: 5 }))
    expect(zoeResult.perKilometer).toBeLessThan(clioResult.perKilometer)
  })
})
