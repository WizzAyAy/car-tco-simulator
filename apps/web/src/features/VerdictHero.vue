<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '~/components/AnimatedNumber.vue'
import { formatEuro, formatYears } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()

const winnerLabel = computed(() => {
  const w = store.comparison.winner
  if (w === 'tie')
    return 'Match nul'
  return w === 'a' ? store.vehicleA.label : store.vehicleB.label
})

const savingsAbs = computed(() => Math.round(store.comparison.savings))
const monthlyEq = computed(() => store.comparison.savings / (store.durationYears * 12))

const breakEvenLabel = computed(() => {
  if (store.comparison.breakEvenYear === null)
    return null
  return `Point d'équilibre atteint après ${formatYears(store.comparison.breakEvenYear)}`
})
</script>

<template>
  <div class="card card-pad" style="background: linear-gradient(180deg, #ffffff 0%, #fafaf9 100%);">
    <div v-if="store.comparison.winner === 'tie'" class="text-center py-6">
      <div class="text-sm text-ink-subtle uppercase tracking-wide mb-2">
        Verdict
      </div>
      <div class="text-3xl font-semibold">
        Coût quasi identique
      </div>
      <p class="text-ink-muted text-sm mt-2">
        Les deux voitures coûtent à peu près la même chose sur {{ formatYears(store.durationYears) }}.
      </p>
    </div>

    <div v-else>
      <div class="text-sm text-ink-subtle uppercase tracking-wide mb-2">
        Verdict sur {{ formatYears(store.durationYears) }}
      </div>
      <div class="flex items-baseline gap-3 flex-wrap">
        <AnimatedNumber
          :value="savingsAbs"
          class="text-5xl sm:text-7xl font-semibold text-accent leading-none"
          :format="(v) => formatEuro(v)"
        />
        <span class="text-xl sm:text-2xl font-medium text-ink-muted">d'économie</span>
      </div>
      <p class="text-base text-ink mt-4 max-w-2xl">
        en choisissant
        <span class="font-semibold">{{ winnerLabel }}</span>
        plutôt que l'autre option — soit
        <span class="font-num font-medium">{{ formatEuro(monthlyEq) }}/mois</span>
        sur la durée.
      </p>
      <p class="text-ink-subtle text-xs mt-2">
        Tous postes inclus : carburant ou électricité, entretien, assurance, dépréciation, malus, etc.
      </p>
      <div v-if="breakEvenLabel" class="badge badge-accent mt-4">
        {{ breakEvenLabel }}
      </div>
    </div>
  </div>
</template>
