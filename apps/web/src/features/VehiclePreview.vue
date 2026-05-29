<script setup lang="ts">
import type { Vehicle } from '@cts/shared'
import { onKeyStroke } from '@vueuse/core'
import { ref } from 'vue'
import VehicleSilhouette from '~/features/VehicleSilhouette.vue'

const props = withDefaults(defineProps<{
  vehicle: Vehicle
  /** 'full' = visible credit line, 'icon' = tiny ⓘ link, 'none' = no overlay. */
  credit?: 'full' | 'icon' | 'none'
  /** Allow click-to-zoom into a fullscreen lightbox (image only). */
  zoomable?: boolean
}>(), {
  credit: 'icon',
  zoomable: false,
})

// Fall back to the silhouette if the image is missing or fails to load.
const broken = ref(false)
const zoomed = ref(false)

function onImageClick(e: MouseEvent) {
  if (props.zoomable && props.vehicle.imageUrl && !broken.value) {
    e.stopPropagation()
    zoomed.value = true
  }
}

onKeyStroke('Escape', () => {
  if (zoomed.value)
    zoomed.value = false
})
</script>

<template>
  <div class="relative h-full w-full">
    <template v-if="vehicle.imageUrl && !broken">
      <img
        :src="vehicle.imageUrl"
        :alt="vehicle.label"
        loading="lazy"
        class="h-full w-full object-contain"
        :class="zoomable ? 'cursor-zoom-in' : ''"
        @error="broken = true"
        @click="onImageClick"
      >
      <a
        v-if="credit === 'full' && vehicle.imageCredit"
        :href="vehicle.imageCredit.sourceUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="absolute bottom-0 right-0 max-w-full truncate rounded-tl-md bg-black/55 px-1.5 py-0.5 text-[10px] text-ink-subtle hover:text-ink transition-colors"
        :title="`${vehicle.imageCredit.author} — ${vehicle.imageCredit.license} (Wikimedia Commons)`"
        @click.stop
      >© {{ vehicle.imageCredit.author }} · {{ vehicle.imageCredit.license }}</a>
      <a
        v-else-if="credit === 'icon' && vehicle.imageCredit"
        :href="vehicle.imageCredit.sourceUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="absolute bottom-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/55 text-[9px] text-ink-subtle hover:text-ink transition-colors"
        :title="`${vehicle.imageCredit.author} — ${vehicle.imageCredit.license} (Wikimedia Commons)`"
        @click.stop
      >ⓘ</a>
    </template>
    <VehicleSilhouette v-else :vehicle="vehicle" />

    <!-- Fullscreen lightbox -->
    <Teleport to="body">
      <Transition name="zoom-fade">
        <div
          v-if="zoomed"
          class="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          @click="zoomed = false"
        >
          <div class="flex justify-end">
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-full glass text-xl text-ink hover:border-accent/50 transition-colors"
              aria-label="Fermer"
              @click.stop="zoomed = false"
            >✕</button>
          </div>
          <div class="flex-1 min-h-0 flex items-center justify-center">
            <img
              :src="vehicle.imageUrl"
              :alt="vehicle.label"
              class="max-h-full max-w-full object-contain rounded-lg"
              @click.stop
            >
          </div>
          <div class="text-center text-xs text-ink-subtle mt-3">
            <span class="font-medium text-ink-muted">{{ vehicle.label }}</span>
            <template v-if="vehicle.imageCredit">
              · © {{ vehicle.imageCredit.author }} ·
              <a
                :href="vehicle.imageCredit.sourceUrl"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="underline hover:text-ink"
                @click.stop
              >{{ vehicle.imageCredit.license }} — Wikimedia Commons</a>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 200ms var(--ease-out-expo);
}
.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
