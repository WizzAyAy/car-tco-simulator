import type { Energy, Vehicle } from '../types'
import { CATEGORY_LABELS_FR, CATEGORY_ORDER } from '../types'
import { VEHICLE_IMAGES } from './images.generated'
import { VEHICLE_PRESETS } from './presets'

/**
 * Archetypes ("meta vehicles") are fictional segment representatives derived
 * from the real catalog: for each (category, energy) bucket we take the median
 * of every spec. They let users compare use cases ("city EV vs estate diesel")
 * without picking a specific model. Vehicle age is handled separately by the
 * purchase condition (new / used), so archetypes always represent a current model.
 */

const ENERGY_LABELS_FR: Record<Energy, string> = {
  gasoline: 'essence',
  diesel: 'diesel',
  hybrid: 'hybride',
  phev: 'hybride rechargeable',
  electric: 'électrique',
}

const ENERGY_ORDER: readonly Energy[] = ['gasoline', 'diesel', 'hybrid', 'phev', 'electric']

/**
 * Premium brands are excluded from the median so an archetype reflects the
 * typical, mainstream car of its segment rather than being pulled up by a few
 * luxury models. Exclusion only applies when enough mainstream models remain
 * (see MIN_BUCKET_SIZE); segments that are genuinely premium-only (e.g. an
 * electric sedan) keep their full bucket so the archetype still exists.
 */
const PREMIUM_BRANDS: ReadonlySet<string> = new Set([
  'Audi',
  'BMW',
  'Mercedes',
  'Tesla',
  'Polestar',
  'Volvo',
  'Porsche',
  'Lexus',
  'Jaguar',
  'Genesis',
  'Mini',
  'DS',
])

/** Minimum real models in a bucket to derive a representative archetype. */
const MIN_BUCKET_SIZE = 3

/**
 * Archetypes must reflect the *current* market, so older catalog models (kept
 * around to widen the used-car comparison) are excluded from the medians. Age
 * is modelled by purchaseCondition, not by the archetype's specs.
 */
const ARCHETYPE_MIN_RELEASE_YEAR = 2022

type NumericVehicleKey =
  | 'purchasePrice'
  | 'consumption'
  | 'co2'
  | 'insuranceCategory'
  | 'maintenanceAnnual'
  | 'tireLifeKm'
  | 'tireSetPrice'
  | 'malus'
  | 'bonus'
  | 'curbWeight'
  | 'releaseYear'

function median(values: readonly number[]): number {
  if (values.length === 0)
    return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0)
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  return sorted[mid]!
}

function medianOf(items: readonly Vehicle[], key: NumericVehicleKey): number {
  return median(items.map(v => v[key]))
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * Build segment archetypes from a catalog. Pure: same input always yields the
 * same output, no Vue or network. Buckets with fewer than `MIN_BUCKET_SIZE`
 * real models are skipped so every archetype stays representative.
 */
export function buildArchetypes(presets: readonly Vehicle[] = VEHICLE_PRESETS): Vehicle[] {
  const archetypes: Vehicle[] = []

  for (const category of CATEGORY_ORDER) {
    for (const energy of ENERGY_ORDER) {
      const bucket = presets.filter(
        v => v.category === category
          && v.energy === energy
          && !v.isArchetype
          && v.releaseYear >= ARCHETYPE_MIN_RELEASE_YEAR,
      )
      if (bucket.length < MIN_BUCKET_SIZE)
        continue

      // Prefer mainstream models; fall back to the full bucket for premium-only segments.
      const mainstream = bucket.filter(v => !PREMIUM_BRANDS.has(v.brand))
      const sample = mainstream.length >= MIN_BUCKET_SIZE ? mainstream : bucket

      const isElectric = energy === 'electric'
      const isEv = energy === 'electric' || energy === 'phev'

      const archetype: Vehicle = {
        id: `archetype-${category.toLowerCase()}-${energy}`,
        label: `${CATEGORY_LABELS_FR[category]} ${ENERGY_LABELS_FR[energy]}`,
        brand: 'Type moyen',
        searchModel: CATEGORY_LABELS_FR[category],
        category,
        energy,
        purchasePrice: roundTo(medianOf(sample, 'purchasePrice'), 100),
        consumption: Math.round(medianOf(sample, 'consumption') * 10) / 10,
        co2: isElectric ? 0 : Math.round(medianOf(sample, 'co2')),
        insuranceCategory: Math.round(medianOf(sample, 'insuranceCategory')),
        maintenanceAnnual: roundTo(medianOf(sample, 'maintenanceAnnual'), 10),
        tireLifeKm: roundTo(medianOf(sample, 'tireLifeKm'), 1000),
        tireSetPrice: roundTo(medianOf(sample, 'tireSetPrice'), 10),
        malus: roundTo(medianOf(sample, 'malus'), 10),
        bonus: roundTo(medianOf(sample, 'bonus'), 10),
        curbWeight: roundTo(medianOf(sample, 'curbWeight'), 5),
        releaseYear: Math.round(medianOf(sample, 'releaseYear')),
        isArchetype: true,
      }

      if (isEv) {
        const range = roundTo(median(sample.map(v => v.wltpRangeKm ?? 0).filter(n => n > 0)), 5)
        if (range > 0)
          archetype.wltpRangeKm = range
      }

      // Borrow the photo of the segment's most representative model (closest to
      // the median price, with an image) so archetypes are never photo-less.
      const representative = [...sample]
        .filter(v => VEHICLE_IMAGES[v.id])
        .sort((a, b) =>
          Math.abs(a.purchasePrice - archetype.purchasePrice)
          - Math.abs(b.purchasePrice - archetype.purchasePrice)
          || a.id.localeCompare(b.id))[0]
      const img = representative && VEHICLE_IMAGES[representative.id]
      if (img) {
        archetype.imageUrl = img.imageUrl
        archetype.imageCredit = img.imageCredit
      }

      archetypes.push(archetype)
    }
  }

  return archetypes
}

export const VEHICLE_ARCHETYPES: readonly Vehicle[] = buildArchetypes()
