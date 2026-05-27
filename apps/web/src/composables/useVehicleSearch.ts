import type { Energy, VehicleCategory } from '@cts/shared'
import type { Ref } from 'vue'
import { VEHICLE_PRESETS } from '@cts/shared'
import { computed } from 'vue'

export type VehiclePreset = typeof VEHICLE_PRESETS[number]

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

    return VEHICLE_PRESETS.filter((preset) => {
      if (category && preset.category !== category)
        return false
      if (energy && preset.energy !== energy)
        return false
      if (!needle)
        return true

      const haystack = normalize(`${preset.label} ${preset.brand} ${preset.searchModel}`)
      return haystack.includes(needle)
    })
  })

  return { results }
}
