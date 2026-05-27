import { describe, expect, it } from 'vitest'
import { buildDefaultInput } from '../src/defaults'
import { computeSensitivity, findBreakEvenAnnualKm, signedSavings } from '../src/tco'
import { findPresetById } from '../src/vehicles'

const clio = findPresetById('clio-essence')!
const e208 = findPresetById('e208-electric')!
const tiguan = findPresetById('tiguan-essence')!

describe('findBreakEvenAnnualKm', () => {
  it('finds a crossover where the cheaper option flips with mileage (thermal vs EV)', () => {
    // Pricier EV vs cheaper thermal: at low km thermal wins, at high km EV wins
    // thanks to far lower energy + maintenance costs.
    const inputA = buildDefaultInput(clio, { durationYears: 6 })
    const inputB = buildDefaultInput(e208, { durationYears: 6 })

    const result = findBreakEvenAnnualKm(inputA, inputB)
    expect(result).not.toBeNull()
    expect(result!.winnerBelow).not.toBe(result!.winnerBeyond)
    expect(result!.annualKm).toBeGreaterThan(2000)
    expect(result!.annualKm).toBeLessThan(60000)
    expect(result!.annualKm % 100).toBe(0)
  })

  it('returns null when the same vehicle wins across the whole range', () => {
    // Identical vehicles never flip — savings are flat zero everywhere.
    const inputA = buildDefaultInput(clio, { durationYears: 5 })
    const inputB = buildDefaultInput(clio, { durationYears: 5 })

    expect(findBreakEvenAnnualKm(inputA, inputB)).toBeNull()
  })

  it('the reported threshold actually brackets the sign change in signed savings', () => {
    const inputA = buildDefaultInput(clio, { durationYears: 6 })
    const inputB = buildDefaultInput(e208, { durationYears: 6 })
    const result = findBreakEvenAnnualKm(inputA, inputB)!

    const below = signedSavings(
      { ...inputA, profile: { ...inputA.profile, annualKm: result.annualKm - 2000 } },
      { ...inputB, profile: { ...inputB.profile, annualKm: result.annualKm - 2000 } },
    )
    const above = signedSavings(
      { ...inputA, profile: { ...inputA.profile, annualKm: result.annualKm + 2000 } },
      { ...inputB, profile: { ...inputB.profile, annualKm: result.annualKm + 2000 } },
    )
    expect(Math.sign(below)).not.toBe(Math.sign(above))
  })
})

describe('computeSensitivity', () => {
  it('returns one row per default factor with a baseline equal to the unchanged savings', () => {
    const inputA = buildDefaultInput(clio, { durationYears: 5 })
    const inputB = buildDefaultInput(e208, { durationYears: 5 })
    const baseline = signedSavings(inputA, inputB)

    const rows = computeSensitivity(inputA, inputB)
    expect(rows).toHaveLength(5)
    for (const row of rows)
      expect(row.baseline).toBeCloseTo(baseline, 6)
  })

  it('sorts rows by descending swing magnitude (tornado ordering)', () => {
    const inputA = buildDefaultInput(clio, { durationYears: 5 })
    const inputB = buildDefaultInput(e208, { durationYears: 5 })

    const rows = computeSensitivity(inputA, inputB)
    const swings = rows.map(r => Math.abs(r.highSavings - r.lowSavings))
    for (let i = 1; i < swings.length; i++)
      expect(swings[i - 1]!).toBeGreaterThanOrEqual(swings[i]!)
  })

  it('apr factor has zero swing when neither vehicle is financed', () => {
    const inputA = buildDefaultInput(clio, { durationYears: 5 })
    const inputB = buildDefaultInput(e208, { durationYears: 5 })

    const rows = computeSensitivity(inputA, inputB)
    const apr = rows.find(r => r.factor === 'apr')!
    expect(apr.lowSavings).toBeCloseTo(apr.baseline, 6)
    expect(apr.highSavings).toBeCloseTo(apr.baseline, 6)
  })

  it('apr factor moves savings when financing is enabled', () => {
    const inputA = buildDefaultInput(tiguan, {
      durationYears: 5,
      financing: { enabled: true, downPayment: 3000, aprPercent: 5, termYears: 5 },
    })
    const inputB = buildDefaultInput(e208, { durationYears: 5 })

    const rows = computeSensitivity(inputA, inputB)
    const apr = rows.find(r => r.factor === 'apr')!
    expect(apr.lowSavings).not.toBeCloseTo(apr.highSavings, 0)
  })

  it('respects a custom deltaPercent (bigger delta widens the swing)', () => {
    const inputA = buildDefaultInput(clio, { durationYears: 5 })
    const inputB = buildDefaultInput(e208, { durationYears: 5 })

    const small = computeSensitivity(inputA, inputB, { deltaPercent: 5, factors: ['annualKm'] })[0]!
    const large = computeSensitivity(inputA, inputB, { deltaPercent: 30, factors: ['annualKm'] })[0]!
    expect(Math.abs(large.highSavings - large.lowSavings))
      .toBeGreaterThan(Math.abs(small.highSavings - small.lowSavings))
  })
})
