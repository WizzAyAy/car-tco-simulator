import type { Energy, Vehicle, VehicleCategory } from '@cts/shared'
import type { Ref } from 'vue'
import { ALL_VEHICLES } from '@cts/shared'
import { computed } from 'vue'

export type VehiclePreset = Vehicle

const DIACRITICS = /[\u0300-\u036F]/g

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .trim()
}

export interface VehicleSearchFilters {
  query: Ref<string>
  category: Ref<VehicleCategory | null>
  energy: Ref<Energy | null>
}

export function useVehicleSearch(filters: VehicleSearchFilters) {
  const results = computed<VehiclePreset[]>(() => {
    const needle = normalize(filters.query.value)
    const category = filters.category.value
    const energy = filters.energy.value

    const matched = ALL_VEHICLES.filter((preset) => {
      if (category && preset.category !== category)
        return false
      if (energy && preset.energy !== energy)
        return false
      if (!needle)
        return true

      const haystack = normalize(`${preset.label} ${preset.brand} ${preset.searchModel}`)
      return haystack.includes(needle)
    })

    // Surface archetypes first — they are the model-independent entry point.
    return [...matched].sort((a, b) => Number(b.isArchetype ?? false) - Number(a.isArchetype ?? false))
  })

  return { results }
}
