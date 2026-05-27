import type { Energy, Vehicle } from '../types'
import { CATEGORY_LABELS_FR, CATEGORY_ORDER } from '../types'
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

/** Minimum real models in a bucket to derive a representative archetype. */
const MIN_BUCKET_SIZE = 3

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
        v => v.category === category && v.energy === energy && !v.isArchetype,
      )
      if (bucket.length < MIN_BUCKET_SIZE)
        continue

      const isElectric = energy === 'electric'
      const isEv = energy === 'electric' || energy === 'phev'

      const archetype: Vehicle = {
        id: `archetype-${category.toLowerCase()}-${energy}`,
        label: `${CATEGORY_LABELS_FR[category]} ${ENERGY_LABELS_FR[energy]}`,
        brand: 'Type moyen',
        searchModel: CATEGORY_LABELS_FR[category],
        category,
        energy,
        purchasePrice: roundTo(medianOf(bucket, 'purchasePrice'), 100),
        consumption: Math.round(medianOf(bucket, 'consumption') * 10) / 10,
        co2: isElectric ? 0 : Math.round(medianOf(bucket, 'co2')),
        insuranceCategory: Math.round(medianOf(bucket, 'insuranceCategory')),
        maintenanceAnnual: roundTo(medianOf(bucket, 'maintenanceAnnual'), 10),
        tireLifeKm: roundTo(medianOf(bucket, 'tireLifeKm'), 1000),
        tireSetPrice: roundTo(medianOf(bucket, 'tireSetPrice'), 10),
        malus: roundTo(medianOf(bucket, 'malus'), 10),
        bonus: roundTo(medianOf(bucket, 'bonus'), 10),
        curbWeight: roundTo(medianOf(bucket, 'curbWeight'), 5),
        releaseYear: Math.round(medianOf(bucket, 'releaseYear')),
        isArchetype: true,
      }

      if (isEv) {
        const range = roundTo(median(bucket.map(v => v.wltpRangeKm ?? 0).filter(n => n > 0)), 5)
        if (range > 0)
          archetype.wltpRangeKm = range
      }

      archetypes.push(archetype)
    }
  }

  return archetypes
}

export const VEHICLE_ARCHETYPES: readonly Vehicle[] = buildArchetypes()
