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
  <div class="card card-glow card-pad relative overflow-hidden sm:px-8 sm:py-10">
    <!-- Ambient glow blob -->
    <div
      class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
      style="background: var(--gradient-accent);"
    />

    <div v-if="store.comparison.winner === 'tie'" class="relative text-center py-6">
      <div class="eyebrow mb-3">
        Verdict
      </div>
      <div class="text-4xl font-bold tracking-tight">
        Coût quasi identique
      </div>
      <p class="text-ink-muted text-sm mt-3">
        Les deux voitures coûtent à peu près la même chose sur {{ formatYears(store.durationYears) }}.
      </p>
    </div>

    <div v-else class="relative">
      <div class="eyebrow mb-4">
        Verdict sur {{ formatYears(store.durationYears) }}
      </div>
      <div class="flex items-baseline gap-3 flex-wrap">
        <AnimatedNumber
          :value="savingsAbs"
          class="text-gradient font-num font-extrabold leading-[0.9] tracking-tight text-[clamp(3rem,8vw,6rem)]"
          style="filter: drop-shadow(0 0 28px rgba(52, 232, 158, 0.45));"
          :format="(v) => formatEuro(v)"
        />
        <span class="text-xl sm:text-2xl font-semibold text-ink-muted">d'économie</span>
      </div>
      <p class="text-base sm:text-lg text-ink mt-5 max-w-2xl">
        en choisissant
        <span class="font-semibold text-accent">{{ winnerLabel }}</span>
        plutôt que l'autre option — soit
        <span class="font-num font-semibold">{{ formatEuro(monthlyEq) }}/mois</span>
        sur la durée.
      </p>
      <p class="text-ink-subtle text-xs mt-2">
        Tous postes inclus : carburant ou électricité, entretien, assurance, dépréciation, malus, etc.
      </p>
      <div v-if="breakEvenLabel" class="badge badge-accent mt-5">
        <span class="dot-pulse h-1.5 w-1.5 rounded-full bg-accent text-accent" />
        {{ breakEvenLabel }}
      </div>
    </div>
  </div>
</template>
