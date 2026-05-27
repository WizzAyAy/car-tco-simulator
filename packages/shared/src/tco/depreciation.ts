import type { Energy, VehicleCategory } from '../types'

const BASE_CURVE: readonly number[] = [
  1.0,
  0.75,
  0.62,
  0.52,
  0.45,
  0.4,
  0.35,
  0.3,
  0.27,
  0.24,
  0.22,
  0.2,
  0.18,
  0.17,
  0.16,
  0.15,
]

const ENERGY_MULTIPLIER: Record<Energy, number> = {
  gasoline: 1.0,
  diesel: 0.95,
  hybrid: 1.05,
  phev: 0.98,
  electric: 0.92,
}

const CATEGORY_MULTIPLIER: Record<VehicleCategory, number> = {
  cityCar: 0.98,
  compact: 1.0,
  sedan: 1.02,
  estate: 1.0,
  suv: 1.05,
  utility: 0.95,
}

export function residualFactor(carAgeYears: number, energy: Energy, category: VehicleCategory): number {
  const idx = Math.min(Math.max(Math.round(carAgeYears), 0), BASE_CURVE.length - 1)
  const base = BASE_CURVE[idx] ?? BASE_CURVE[BASE_CURVE.length - 1]!
  const mult = ENERGY_MULTIPLIER[energy] * CATEGORY_MULTIPLIER[category]
  const adjusted = base ** (1 / mult)
  return Math.min(1, Math.max(0.05, adjusted))
}

export function residualValue(
  purchasePrice: number,
  carAgeYears: number,
  energy: Energy,
  category: VehicleCategory,
): number {
  return Math.round(purchasePrice * residualFactor(carAgeYears, energy, category))
}

export function relativeResidualFactor(
  yearsOwned: number,
  priorYears: number,
  energy: Energy,
  category: VehicleCategory,
): number {
  const baseFactor = residualFactor(priorYears, energy, category)
  if (baseFactor === 0)
    return 0
  const currentFactor = residualFactor(priorYears + yearsOwned, energy, category)
  return currentFactor / baseFactor
}
