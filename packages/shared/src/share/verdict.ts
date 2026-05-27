import type { ComparisonResult } from '../types'

export type VerdictSummary = {
  headline: string
  sub: string
}

function formatEuro(value: number): string {
  const rounded = Math.round(value)
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(rounded)
  return `${formatted} €`
}

function durationLabel(durationYears: number): string {
  return durationYears <= 1 ? '1 an' : `${durationYears} ans`
}

/**
 * Builds the French social-share verdict for a comparison.
 *
 * @example
 * // { headline: "Model Y = −3 240 € sur 5 ans", sub: "vs Clio essence" }
 */
export function buildVerdictSummary(
  comparison: ComparisonResult,
  vehicleALabel: string,
  vehicleBLabel: string,
  durationYears: number,
): VerdictSummary {
  const duration = durationLabel(durationYears)

  if (comparison.winner === 'tie') {
    return {
      headline: `${vehicleALabel} = ${vehicleBLabel} sur ${duration}`,
      sub: 'Coût quasi identique',
    }
  }

  const winnerLabel = comparison.winner === 'a' ? vehicleALabel : vehicleBLabel
  const loserLabel = comparison.winner === 'a' ? vehicleBLabel : vehicleALabel
  const savings = formatEuro(comparison.savings)

  return {
    headline: `${winnerLabel} = −${savings} sur ${duration}`,
    sub: `vs ${loserLabel}`,
  }
}
