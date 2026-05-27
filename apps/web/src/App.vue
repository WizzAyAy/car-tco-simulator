<script setup lang="ts">
import { onMounted } from 'vue'
import { useShareState } from '~/composables/useShareState'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()
const share = useShareState()

onMounted(() => {
  share.applyFromQuery()
  share.watchStore()
  store.loadLivePrices()
})
</script>

<template>
  <div class="min-h-full">
    <RouterView />
  </div>
</template>
