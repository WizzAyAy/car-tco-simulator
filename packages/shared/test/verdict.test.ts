import type { ComparisonResult, TCOResult } from '../src/types'
import { describe, expect, it } from 'vitest'
import { buildVerdictSummary } from '../src/share'

function makeResult(label: string, totalCost: number): TCOResult {
  return {
    vehicleId: label,
    vehicleLabel: label,
    durationYears: 5,
    totalCost,
    monthlyEquivalent: totalCost / 60,
    perKilometer: 0,
    residualValue: 0,
    byCategory: {
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
      depreciation: 0,
      carbon: 0,
    },
    byYear: [],
    co2EmittedKg: 0,
  }
}

function makeComparison(
  aCost: number,
  bCost: number,
  overrides: Partial<ComparisonResult> = {},
): ComparisonResult {
  const diff = aCost - bCost
  const savings = Math.abs(diff)
  const winner = savings < 100 ? 'tie' : diff > 0 ? 'b' : 'a'
  return {
    a: makeResult('A', aCost),
    b: makeResult('B', bCost),
    winner,
    savings,
    savingsPercent: (savings / Math.max(aCost, bCost)) * 100,
    breakEvenYear: null,
    ...overrides,
  }
}

// French Intl.NumberFormat uses a narrow no-break space (U+202F) for grouping.
const NNBSP = ' '

describe('buildVerdictSummary', () => {
  it('reports the cheaper vehicle (B) with formatted savings and duration', () => {
    const comparison = makeComparison(33240, 30000)
    const verdict = buildVerdictSummary(comparison, 'Clio essence', 'Model Y', 5)
    expect(verdict.headline).toBe(`Model Y = −3${NNBSP}240 € sur 5 ans`)
    expect(verdict.sub).toBe('vs Clio essence')
  })

  it('reports the cheaper vehicle when A wins', () => {
    const comparison = makeComparison(20000, 24500)
    const verdict = buildVerdictSummary(comparison, 'Zoé', 'Tiguan diesel', 7)
    expect(verdict.headline).toBe(`Zoé = −4${NNBSP}500 € sur 7 ans`)
    expect(verdict.sub).toBe('vs Tiguan diesel')
  })

  it('uses singular "an" for a one-year horizon', () => {
    const comparison = makeComparison(15000, 13800)
    const verdict = buildVerdictSummary(comparison, 'Polo', 'e-208', 1)
    expect(verdict.headline).toBe(`e-208 = −1${NNBSP}200 € sur 1 an`)
  })

  it('handles a tie', () => {
    const comparison = makeComparison(20000, 20050)
    const verdict = buildVerdictSummary(comparison, 'Clio', 'Polo', 5)
    expect(comparison.winner).toBe('tie')
    expect(verdict.headline).toBe('Clio = Polo sur 5 ans')
    expect(verdict.sub).toBe('Coût quasi identique')
  })

  it('formats large savings with grouped thousands', () => {
    const comparison = makeComparison(50000, 38000)
    const verdict = buildVerdictSummary(comparison, 'RAV4', 'Model Y', 10)
    expect(verdict.headline).toBe(`Model Y = −12${NNBSP}000 € sur 10 ans`)
  })
})
