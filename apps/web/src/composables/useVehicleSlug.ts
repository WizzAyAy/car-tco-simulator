import type { Vehicle } from '@cts/shared'
import { findPresetById } from '@cts/shared'

/**
 * Slug scheme: preset ids are already URL-safe, lowercase and stable
 * (e.g. `clio-essence`, `model3-electric`), so they double as SEO slugs.
 * Keeping slug === id avoids a second mapping to maintain and guarantees
 * round-trip stability between routes and the store.
 */
export function presetToSlug(vehicle: Vehicle): string {
  return vehicle.id
}

export function slugToPreset(slug: string): Vehicle | undefined {
  return findPresetById(slug)
}

export function isValidSlug(slug: string): boolean {
  return slugToPreset(slug) !== undefined
}

/**
 * Curated, SEO-relevant comparison pairs for the `/compare` index page.
 * Each pair contrasts a meaningful buying decision (energy or category).
 */
export interface ComparisonPair {
  slugA: string
  slugB: string
}

export const POPULAR_COMPARISONS: readonly ComparisonPair[] = [
  { slugA: 'clio-essence', slugB: 'e208-electric' },
  { slugA: '208-essence', slugB: 'e208-electric' },
  { slugA: 'clio-diesel', slugB: 'yaris-hybrid' },
  { slugA: 'model3-electric', slugB: 'model3-lr-electric' },
  { slugA: 'modely-electric', slugB: 'id4-electric' },
  { slugA: 'tiguan-essence', slugB: 'modely-electric' },
  { slugA: 'sandero-essence', slugB: 'spring-electric' },
  { slugA: '3008-hybrid', slugB: '3008-phev' },
  { slugA: 'octavia-essence', slugB: 'octavia-diesel' },
  { slugA: 'duster-essence', slugB: 'captur-etech-hybrid' },
  { slugA: 'megane-estate-essence', slugB: 'megane-etech-electric' },
  { slugA: 'r5-etech-electric', slugB: 'mg4-electric' },
].filter(pair => isValidSlug(pair.slugA) && isValidSlug(pair.slugB))

export function resolveComparisonPair(pair: ComparisonPair): {
  slugA: string
  slugB: string
  vehicleA: Vehicle
  vehicleB: Vehicle
} | null {
  const vehicleA = slugToPreset(pair.slugA)
  const vehicleB = slugToPreset(pair.slugB)
  if (!vehicleA || !vehicleB)
    return null
  return { slugA: pair.slugA, slugB: pair.slugB, vehicleA, vehicleB }
}
