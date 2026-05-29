<script setup lang="ts">
import type { PurchaseCondition, Vehicle } from '@cts/shared'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useListingLinks } from '~/composables/useListingLinks'

defineProps<{
  vehicle: Vehicle
  condition: PurchaseCondition
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!root.value)
    return
  if (!root.value.contains(e.target as Node))
    open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button
      type="button"
      class="btn btn-ghost text-xs px-2.5 py-1.5 gap-1.5"
      @click.stop="toggle"
    >
      <span class="text-sm leading-none">🔎</span>
      <span>Voir les annonces</span>
      <span class="text-ink-subtle text-[10px]" :class="open ? 'rotate-180' : ''">▾</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute left-0 mt-1 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-line glass shadow-[var(--shadow-lift)] overflow-hidden"
      >
        <div class="px-3 py-2 border-b border-line">
          <div class="text-[11px] uppercase tracking-wide text-ink-subtle">
            Cherche un prix réel pour
          </div>
          <div class="text-sm font-medium leading-tight">
            {{ vehicle.brand }} {{ vehicle.searchModel }}
          </div>
          <div class="text-[11px] text-ink-subtle mt-0.5">
            {{ condition === 'new' ? 'Sortie de concession' : condition === 'usedRecent' ? 'Occasion ~3 ans' : 'Occasion ~6 ans' }}
          </div>
        </div>
        <ul class="py-1">
          <li
            v-for="link in useListingLinks(vehicle, condition)"
            :key="link.id"
          >
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
              @click="close"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full shrink-0"
                  :style="{ background: link.brandColor }"
                />
                <div>
                  <div class="text-sm font-medium leading-tight">{{ link.label }}</div>
                  <div class="text-[11px] text-ink-subtle">{{ link.hint }}</div>
                </div>
              </div>
              <span class="text-ink-subtle text-xs">↗</span>
            </a>
          </li>
        </ul>
        <div class="px-3 py-2 border-t border-line bg-black/20">
          <div class="text-[11px] text-ink-subtle leading-relaxed">
            Les liens ouvrent une nouvelle page chez chaque site avec une recherche pré-remplie.
            Ajuste les filtres sur place pour affiner.
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
