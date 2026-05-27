import type { ComputedRef } from 'vue'
import { buildVerdictSummary } from '@cts/shared'
import { computed } from 'vue'
import { useSimulationStore } from '~/stores/simulation'

export interface LiveVerdict {
  headline: string
  sub: string
  ogImageUrl: string
}

function resolveOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin
}

/**
 * Derives the live social-share verdict (headline/sub via `buildVerdictSummary`)
 * and the absolute `og:image` URL pointing at the dynamic `/api/og` endpoint,
 * reacting to the current store comparison. Single source of truth for the
 * comparison social card — consumed by `ComparisonPage`.
 */
export function useLiveVerdict(): ComputedRef<LiveVerdict> {
  const store = useSimulationStore()

  return computed(() => {
    const comparison = { a: store.resultA, b: store.resultB, ...store.comparison }
    const labelA = store.vehicleA.label
    const labelB = store.vehicleB.label
    const duration = store.durationYears

    const summary = buildVerdictSummary(comparison, labelA, labelB, duration)

    const winnerLabel = comparison.winner === 'b' ? labelB : labelA
    const loserLabel = comparison.winner === 'b' ? labelA : labelB

    const params = new URLSearchParams({
      winner: winnerLabel,
      loser: loserLabel,
      savings: String(Math.round(comparison.savings)),
      duration: String(duration),
    })
    if (comparison.winner === 'tie')
      params.set('tie', '1')

    return {
      headline: summary.headline,
      sub: summary.sub,
      ogImageUrl: `${resolveOrigin()}/api/og?${params.toString()}`,
    }
  })
}
