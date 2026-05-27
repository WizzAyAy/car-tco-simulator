import type { Vehicle } from '../types'
import { VEHICLE_ARCHETYPES } from './archetypes'
import { VEHICLE_PRESETS } from './presets'

export { buildArchetypes, VEHICLE_ARCHETYPES } from './archetypes'
export { VEHICLE_PRESETS } from './presets'

/** Real catalog models plus derived segment archetypes. */
export const ALL_VEHICLES: readonly Vehicle[] = [...VEHICLE_PRESETS, ...VEHICLE_ARCHETYPES]

/** Resolve any vehicle id — real preset or archetype. */
export function findPresetById(id: string): Vehicle | undefined {
  return ALL_VEHICLES.find(v => v.id === id)
}
