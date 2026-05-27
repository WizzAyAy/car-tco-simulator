<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import { usePageMeta } from '~/composables/usePageMeta'
import { POPULAR_COMPARISONS, resolveComparisonPair } from '~/composables/useVehicleSlug'

usePageMeta(
  'Comparatifs de voitures populaires · Car TCO Simulator',
  'Comparatifs de coût total d\'usage entre voitures essence, diesel, hybride et '
  + 'électrique. Trouve laquelle coûte le moins cher sur la durée.',
)

const pairs = computed(() =>
  POPULAR_COMPARISONS.map(resolveComparisonPair).filter(p => p !== null),
)
</script>

<template>
  <div class="min-h-full flex flex-col bg-canvas">
    <AppHeader />

    <main class="mx-auto max-w-[1400px] w-full px-6 py-8 flex-1">
      <section class="mb-8 max-w-3xl">
        <h1 class="text-3xl sm:text-4xl font-semibold leading-tight mb-3">
          Comparatifs de voitures populaires
        </h1>
        <p class="text-ink-muted text-base">
          Chaque comparatif chiffre le coût total d'usage des deux modèles — carburant ou
          électricité, entretien, assurance, dépréciation et plus. Choisis un duel ci-dessous
          ou
          <RouterLink to="/" class="text-accent font-medium hover:underline">
            compose le tien
          </RouterLink>.
        </p>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          v-for="pair in pairs"
          :key="`${pair.slugA}-${pair.slugB}`"
          :to="`/compare/${pair.slugA}-vs-${pair.slugB}`"
          class="card card-pad hover:border-accent transition-colors"
        >
          <div class="text-sm font-semibold text-ink leading-snug">
            {{ pair.vehicleA.label }}
          </div>
          <div class="text-xs text-ink-subtle uppercase tracking-wide my-1.5">
            vs
          </div>
          <div class="text-sm font-semibold text-ink leading-snug">
            {{ pair.vehicleB.label }}
          </div>
          <div class="text-xs text-accent font-medium mt-3">
            Voir le comparatif →
          </div>
        </RouterLink>
      </section>
    </main>

    <footer class="border-t border-line py-4 text-center text-xs text-ink-subtle">
      Car TCO Simulator · open data : data.gouv.fr · ADEME
    </footer>
  </div>
</template>
