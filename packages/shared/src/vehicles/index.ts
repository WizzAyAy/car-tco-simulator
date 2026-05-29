import type { Vehicle } from '../types'
import { VEHICLE_ARCHETYPES } from './archetypes'
import { VEHICLE_IMAGES } from './images.generated'
import { VEHICLE_PRESETS as RAW_PRESETS } from './presets'

export { buildArchetypes, VEHICLE_ARCHETYPES } from './archetypes'

function withImage(v: Vehicle): Vehicle {
  const img = VEHICLE_IMAGES[v.id]
  return img ? { ...v, imageUrl: img.imageUrl, imageCredit: img.imageCredit } : v
}

/** Real catalog models, with CC preview images merged in where available. */
export const VEHICLE_PRESETS: readonly Vehicle[] = RAW_PRESETS.map(withImage)

/** Real catalog models plus derived segment archetypes. */
export const ALL_VEHICLES: readonly Vehicle[] = [...VEHICLE_PRESETS, ...VEHICLE_ARCHETYPES]

/** Resolve any vehicle id — real preset or archetype. */
export function findPresetById(id: string): Vehicle | undefined {
  return ALL_VEHICLES.find(v => v.id === id)
}
