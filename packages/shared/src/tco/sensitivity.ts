import type { TCOInput } from '../types'
import { computeTCO } from './compute'

/**
 * Signed savings between two scenarios, expressed from B's point of view:
 * a positive value means option B is cheaper than option A (B wins) by that amount,
 * a negative value means option A is cheaper. This matches the `compareTCO`
 * convention where `winner === 'b'` when A costs more than B.
 */
export function signedSavings(inputA: TCOInput, inputB: TCOInput): number {
  return computeTCO(inputA).totalCost - computeTCO(inputB).totalCost
}

function withAnnualKm(input: TCOInput, annualKm: number): TCOInput {
  return {
    ...input,
    profile: { ...input.profile, annualKm },
  }
}

export interface BreakEvenResult {
  /** Annual km at which the cheaper option flips, or null if no flip in range. */
  annualKm: number
  /** The option that becomes cheaper at and beyond `annualKm`. */
  winnerBeyond: 'a' | 'b'
  /** The option that is cheaper below `annualKm`. */
  winnerBelow: 'a' | 'b'
}

export interface BreakEvenParams {
  minKm?: number
  maxKm?: number
  stepKm?: number
}

const DEFAULT_BREAK_EVEN: Required<BreakEvenParams> = {
  minKm: 2000,
  maxKm: 60000,
  stepKm: 100,
}

/**
 * Scans annual mileage between `minKm` and `maxKm`, recomputing both TCOs at
 * each step, and returns the mileage at which the cheaper vehicle flips.
 * Returns null when the same vehicle wins across the whole range (no crossover).
 * Pure: no Vue, no fetch — only arithmetic over `computeTCO`.
 */
export function findBreakEvenAnnualKm(
  inputA: TCOInput,
  inputB: TCOInput,
  params: BreakEvenParams = {},
): BreakEvenResult | null {
  const { minKm, maxKm, stepKm } = { ...DEFAULT_BREAK_EVEN, ...params }
  if (stepKm <= 0 || maxKm <= minKm)
    return null

  const winnerAt = (km: number): 'a' | 'b' => (signedSavings(withAnnualKm(inputA, km), withAnnualKm(inputB, km)) >= 0 ? 'b' : 'a')

  let prevKm = minKm
  let prevWinner = winnerAt(minKm)

  for (let km = minKm + stepKm; km <= maxKm; km += stepKm) {
    const winner = winnerAt(km)
    if (winner !== prevWinner) {
      return {
        annualKm: refineCrossover(inputA, inputB, prevKm, km, prevWinner),
        winnerBeyond: winner,
        winnerBelow: prevWinner,
      }
    }
    prevKm = km
    prevWinner = winner
  }

  return null
}

/**
 * Binary-search the crossover mileage between two bracketing points to a
 * 50 km resolution, so the reported threshold reads cleanly.
 */
function refineCrossover(
  inputA: TCOInput,
  inputB: TCOInput,
  lowKm: number,
  highKm: number,
  lowWinner: 'a' | 'b',
): number {
  let lo = lowKm
  let hi = highKm
  while (hi - lo > 50) {
    const mid = Math.round((lo + hi) / 2)
    const midWinner = signedSavings(withAnnualKm(inputA, mid), withAnnualKm(inputB, mid)) >= 0 ? 'b' : 'a'
    if (midWinner === lowWinner)
      lo = mid
    else hi = mid
  }
  return Math.round(hi / 100) * 100
}

export type SensitivityFactor
  = | 'annualKm'
    | 'energyPrice'
    | 'depreciation'
    | 'duration'
    | 'apr'

export interface SensitivityRow {
  factor: SensitivityFactor
  /** Signed savings (B point of view) when the factor is lowered by `deltaPercent`. */
  lowSavings: number
  /** Signed savings (B point of view) when the factor is raised by `deltaPercent`. */
  highSavings: number
  /** Signed savings at the unchanged baseline assumptions. */
  baseline: number
}

export interface SensitivityParams {
  /** Relative variation applied to each factor, in percent. Defaults to 15. */
  deltaPercent?: number
  /** Restrict the analysis to a subset of factors (defaults to all relevant). */
  factors?: SensitivityFactor[]
}

const DEFAULT_FACTORS: SensitivityFactor[] = ['annualKm', 'energyPrice', 'depreciation', 'duration', 'apr']

function scaleEnergyPrices(input: TCOInput, factor: number): TCOInput {
  const p = input.profile
  return {
    ...input,
    profile: {
      ...p,
      gasolinePricePerLiter: p.gasolinePricePerLiter * factor,
      dieselPricePerLiter: p.dieselPricePerLiter * factor,
      electricityHomePricePerKwh: p.electricityHomePricePerKwh * factor,
      electricityFastPricePerKwh: p.electricityFastPricePerKwh * factor,
    },
  }
}

/**
 * Depreciation is driven by purchase price (residual is a fraction of it), so
 * scaling the purchase price proxies a depreciation-curve shift on both cars.
 */
function scaleDepreciation(input: TCOInput, factor: number): TCOInput {
  return {
    ...input,
    vehicle: { ...input.vehicle, purchasePrice: input.vehicle.purchasePrice * factor },
  }
}

function scaleDuration(input: TCOInput, factor: number): TCOInput {
  const scaled = Math.round(input.durationYears * factor)
  return { ...input, durationYears: Math.max(1, scaled) }
}

function scaleApr(input: TCOInput, factor: number): TCOInput {
  return {
    ...input,
    financing: { ...input.financing, aprPercent: input.financing.aprPercent * factor },
  }
}

function applyFactor(input: TCOInput, factor: SensitivityFactor, multiplier: number): TCOInput {
  switch (factor) {
    case 'annualKm':
      return withAnnualKm(input, input.profile.annualKm * multiplier)
    case 'energyPrice':
      return scaleEnergyPrices(input, multiplier)
    case 'depreciation':
      return scaleDepreciation(input, multiplier)
    case 'duration':
      return scaleDuration(input, multiplier)
    case 'apr':
      return scaleApr(input, multiplier)
  }
}

/**
 * Tornado-chart sensitivity: for each assumption, vary it by ±`deltaPercent`
 * on BOTH inputs simultaneously and measure the impact on the signed savings.
 * Rows are sorted by descending swing (|high − low|) so the most influential
 * factor sits on top, the classic tornado ordering.
 * Pure: testable without Vue or fetch.
 */
export function computeSensitivity(
  inputA: TCOInput,
  inputB: TCOInput,
  params: SensitivityParams = {},
): SensitivityRow[] {
  const deltaPercent = params.deltaPercent ?? 15
  const factors = params.factors ?? DEFAULT_FACTORS
  const baseline = signedSavings(inputA, inputB)
  const low = 1 - deltaPercent / 100
  const high = 1 + deltaPercent / 100

  const rows: SensitivityRow[] = factors.map((factor) => {
    if (factor === 'apr' && !inputA.financing.enabled && !inputB.financing.enabled) {
      return { factor, lowSavings: baseline, highSavings: baseline, baseline }
    }
    return {
      factor,
      lowSavings: signedSavings(applyFactor(inputA, factor, low), applyFactor(inputB, factor, low)),
      highSavings: signedSavings(applyFactor(inputA, factor, high), applyFactor(inputB, factor, high)),
      baseline,
    }
  })

  return rows.sort((a, b) => Math.abs(b.highSavings - b.lowSavings) - Math.abs(a.highSavings - a.lowSavings))
}
