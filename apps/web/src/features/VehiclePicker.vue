<script setup lang="ts">
import type { Energy, VehicleCategory } from '@cts/shared'
import type { VehiclePreset } from '~/composables/useVehicleSearch'
import { CATEGORY_LABELS_FR, CATEGORY_ORDER, VEHICLE_PRESETS } from '@cts/shared'
import { onClickOutside, refDebounced, useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { formatEuro } from '~/composables/useFormatters'
import { useVehicleSearch } from '~/composables/useVehicleSearch'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const ENERGY_MARKERS: Record<Energy, string> = {
  gasoline: '⛽',
  diesel: '⛽',
  hybrid: '🍃',
  phev: '🔌',
  electric: '⚡',
}

const ENERGY_FILTERS: { value: Energy, label: string }[] = [
  { value: 'gasoline', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'phev', label: 'Hybride rech.' },
  { value: 'electric', label: 'Électrique' },
]

const open = ref(false)
const panel = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const query = ref('')
const debouncedQuery = refDebounced(query, 120)
const category = ref<VehicleCategory | null>(null)
const energy = ref<Energy | null>(null)

const { results } = useVehicleSearch({ query: debouncedQuery, category, energy })

const current = computed(() => VEHICLE_PRESETS.find(p => p.id === props.modelValue))

function hasRange(preset: VehiclePreset): boolean {
  return preset.wltpRangeKm != null && (preset.energy === 'electric' || preset.energy === 'phev')
}

function openPanel() {
  query.value = ''
  category.value = null
  energy.value = null
  open.value = true
  nextTick(() => searchInput.value?.focus())
}

function close() {
  open.value = false
}

function pick(id: string) {
  emit('update:modelValue', id)
  close()
}

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value)
    close()
})

watch(panel, (el) => {
  if (el)
    onClickOutside(el, () => close())
})
</script>

<template>
  <div>
    <label class="label"><span>Modèle</span></label>
    <button
      type="button"
      class="input-base mb-4 flex items-center justify-between gap-2 text-left"
      @click="openPanel"
    >
      <span class="flex items-center gap-2 min-w-0">
        <span v-if="current" class="text-base leading-none shrink-0">{{ ENERGY_MARKERS[current.energy] }}</span>
        <span class="truncate">{{ current?.label ?? 'Choisir un modèle' }}</span>
      </span>
      <span class="text-ink-subtle text-xs shrink-0">▾</span>
    </button>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-[8vh] bg-ink/40 backdrop-blur-sm"
        >
          <div
            ref="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Choisir un modèle de véhicule"
            class="card w-full max-w-2xl max-h-[84vh] flex flex-col overflow-hidden"
          >
            <div class="card-pad border-b border-line flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold leading-tight">
                  Choisir un modèle
                </h2>
                <p class="text-xs text-ink-subtle mt-0.5">
                  Recherche et filtre parmi {{ VEHICLE_PRESETS.length }} véhicules
                </p>
              </div>
              <button
                type="button"
                class="text-ink-subtle hover:text-ink text-xl leading-none"
                aria-label="Fermer"
                @click="close"
              >
                ✕
              </button>
            </div>

            <div class="card-pad border-b border-line space-y-3">
              <input
                ref="searchInput"
                v-model="query"
                type="search"
                class="input-base"
                placeholder="Rechercher une marque ou un modèle…"
              >

              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="btn btn-ghost text-xs px-2.5 py-1"
                  :class="category === null ? '!bg-ink !text-canvas-elevated !border-ink' : ''"
                  @click="category = null"
                >
                  Toutes
                </button>
                <button
                  v-for="cat in CATEGORY_ORDER"
                  :key="cat"
                  type="button"
                  class="btn btn-ghost text-xs px-2.5 py-1"
                  :class="category === cat ? '!bg-ink !text-canvas-elevated !border-ink' : ''"
                  @click="category = cat"
                >
                  {{ CATEGORY_LABELS_FR[cat] }}
                </button>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="btn btn-ghost text-xs px-2.5 py-1"
                  :class="energy === null ? '!bg-ink !text-canvas-elevated !border-ink' : ''"
                  @click="energy = null"
                >
                  Toutes
                </button>
                <button
                  v-for="opt in ENERGY_FILTERS"
                  :key="opt.value"
                  type="button"
                  class="btn btn-ghost text-xs px-2.5 py-1 gap-1"
                  :class="energy === opt.value ? '!bg-ink !text-canvas-elevated !border-ink' : ''"
                  @click="energy = opt.value"
                >
                  <span class="leading-none">{{ ENERGY_MARKERS[opt.value] }}</span>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="px-6 py-2 text-xs text-ink-subtle border-b border-line">
              {{ results.length }} {{ results.length > 1 ? 'résultats' : 'résultat' }}
            </div>

            <div class="flex-1 overflow-y-auto p-2">
              <p v-if="results.length === 0" class="text-center text-sm text-ink-subtle py-10">
                Aucun véhicule
              </p>
              <ul v-else class="space-y-1">
                <li v-for="preset in results" :key="preset.id">
                  <button
                    type="button"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors"
                    :class="preset.id === modelValue
                      ? 'border-ink bg-ink text-canvas-elevated'
                      : 'border-transparent hover:bg-canvas hover:border-line'"
                    @click="pick(preset.id)"
                  >
                    <span class="text-base leading-none shrink-0">{{ ENERGY_MARKERS[preset.energy] }}</span>
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium leading-tight truncate">{{ preset.label }}</span>
                      <span
                        class="block text-xs mt-0.5 font-num"
                        :class="preset.id === modelValue ? 'opacity-70' : 'text-ink-subtle'"
                      >
                        {{ formatEuro(preset.purchasePrice) }}
                      </span>
                    </span>
                    <span
                      v-if="hasRange(preset)"
                      class="badge text-[11px] shrink-0"
                      :class="preset.id === modelValue ? '!bg-canvas-elevated/15 !border-transparent !text-canvas-elevated' : 'badge-accent'"
                    >
                      ⚡ {{ preset.wltpRangeKm }} km
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 160ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
