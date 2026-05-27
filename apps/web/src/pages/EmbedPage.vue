<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePageMeta } from '~/composables/usePageMeta'
import { slugToPreset } from '~/composables/useVehicleSlug'
import CumulativeChart from '~/features/CumulativeChart.vue'
import VerdictHero from '~/features/VerdictHero.vue'
import { useSimulationStore } from '~/stores/simulation'

const route = useRoute()
const store = useSimulationStore()

const vehicleA = computed(() => slugToPreset(String(route.query.a ?? '')))
const vehicleB = computed(() => slugToPreset(String(route.query.b ?? '')))

watchEffect(() => {
  if (vehicleA.value)
    store.selectPresetA(vehicleA.value.id)
  if (vehicleB.value)
    store.selectPresetB(vehicleB.value.id)
})

usePageMeta('Comparatif coût total · Car TCO Simulator')

const deepLink = computed(() => {
  const a = store.vehicleA.id
  const b = store.vehicleB.id
  return `${window.location.origin}/compare/${a}-vs-${b}`
})
</script>

<template>
  <div class="bg-canvas p-3 flex flex-col gap-3">
    <VerdictHero />
    <CumulativeChart />
    <a
      :href="deepLink"
      target="_blank"
      rel="noopener"
      class="text-xs text-ink-subtle text-center hover:text-accent"
    >
      Comparatif détaillé sur Car TCO Simulator →
    </a>
  </div>
</template>
