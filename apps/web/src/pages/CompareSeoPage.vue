<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePageMeta } from '~/composables/usePageMeta'
import { slugToPreset } from '~/composables/useVehicleSlug'
import ComparisonPage from '~/pages/ComparisonPage.vue'
import { useSimulationStore } from '~/stores/simulation'

const route = useRoute()
const store = useSimulationStore()

const vehicleA = computed(() => slugToPreset(String(route.params.slugA)))
const vehicleB = computed(() => slugToPreset(String(route.params.slugB)))

watchEffect(() => {
  if (vehicleA.value) store.selectPresetA(vehicleA.value.id)
  if (vehicleB.value) store.selectPresetB(vehicleB.value.id)
})

const title = computed(() => {
  const a = vehicleA.value?.label ?? 'Voiture A'
  const b = vehicleB.value?.label ?? 'Voiture B'
  return `${a} vs ${b} : comparatif coût total · Car TCO Simulator`
})

const description = computed(() => {
  const a = vehicleA.value?.label ?? 'la première voiture'
  const b = vehicleB.value?.label ?? 'la seconde voiture'
  return `Comparatif du coût total d'usage entre ${a} et ${b} : carburant ou électricité, `
    + `entretien, assurance, dépréciation, malus et financement, sur la durée de ton choix.`
})

usePageMeta(title, description)
</script>

<template>
  <ComparisonPage />
</template>
