<script setup lang="ts">
import type { TripMix, Vehicle } from '@cts/shared'
import { buildDefaultInput, computeTCO, DEFAULT_PROFILE, VEHICLE_PRESETS } from '@cts/shared'
import { computed, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import { formatEuro, formatNumber } from '~/composables/useFormatters'
import { usePageMeta } from '~/composables/usePageMeta'

usePageMeta(
  'Quelle voiture coûte le moins cher pour mon profil ? · Car TCO Simulator',
  'Renseigne ton kilométrage, ton type de trajet et ton budget : on classe toutes les '
  + 'voitures par coût total d\'usage et on désigne la moins chère pour toi.',
)

type TripType = 'urban' | 'mixed' | 'highway'

const TRIP_MIXES: Record<TripType, TripMix> = {
  urban: { urban: 0.7, road: 0.25, highway: 0.05 },
  mixed: { urban: 0.45, road: 0.35, highway: 0.2 },
  highway: { urban: 0.2, road: 0.3, highway: 0.5 },
}

const TRIP_LABELS: Record<TripType, string> = {
  urban: 'Surtout en ville',
  mixed: 'Mixte',
  highway: 'Surtout autoroute',
}

const form = reactive({
  annualKm: 15000,
  tripType: 'mixed' as TripType,
  maxBudget: 60000,
  hasHomeCharging: true,
  durationYears: 5,
})

interface RankedVehicle {
  vehicle: Vehicle
  totalCost: number
  monthlyEquivalent: number
}

const ranking = computed<RankedVehicle[]>(() => {
  const profile = {
    ...DEFAULT_PROFILE,
    annualKm: form.annualKm,
    tripMix: { ...TRIP_MIXES[form.tripType] },
    hasHomeCharging: form.hasHomeCharging,
    homeChargingMix: form.hasHomeCharging
      ? { home: 0.85, fastStation: 0.15 }
      : { home: 0, fastStation: 1 },
  }

  return VEHICLE_PRESETS
    .filter(vehicle => vehicle.purchasePrice <= form.maxBudget)
    .map((vehicle) => {
      const result = computeTCO(buildDefaultInput(vehicle, {
        profile,
        durationYears: form.durationYears,
      }))
      return {
        vehicle,
        totalCost: result.totalCost,
        monthlyEquivalent: result.monthlyEquivalent,
      }
    })
    .sort((a, b) => a.totalCost - b.totalCost)
})

const cheapest = computed(() => ranking.value[0] ?? null)
</script>

<template>
  <div class="min-h-full flex flex-col bg-canvas">
    <AppHeader />

    <main class="mx-auto max-w-[1100px] w-full px-6 py-8 flex-1">
      <section class="mb-8 max-w-3xl">
        <h1 class="text-3xl sm:text-4xl font-semibold leading-tight mb-3">
          Quelle voiture coûte le moins cher<br>pour ton usage ?
        </h1>
        <p class="text-ink-muted text-base">
          Décris ton profil : on calcule le coût total d'usage de
          {{ VEHICLE_PRESETS.length }} modèles et on les classe du moins cher au plus cher.
        </p>
      </section>

      <section class="card card-pad mb-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label class="block">
          <span class="text-sm font-medium text-ink">Kilométrage annuel</span>
          <div class="flex items-center gap-3 mt-2">
            <input
              v-model.number="form.annualKm"
              type="range"
              min="5000"
              max="50000"
              step="1000"
              class="flex-1"
            >
            <span class="font-num text-sm w-24 text-right">{{ formatNumber(form.annualKm) }} km</span>
          </div>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-ink">Durée de détention</span>
          <div class="flex items-center gap-3 mt-2">
            <input
              v-model.number="form.durationYears"
              type="range"
              min="1"
              max="15"
              step="1"
              class="flex-1"
            >
            <span class="font-num text-sm w-24 text-right">{{ form.durationYears }} ans</span>
          </div>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-ink">Type de trajet</span>
          <select v-model="form.tripType" class="input-base mt-2">
            <option v-for="(label, key) in TRIP_LABELS" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-ink">Budget d'achat max</span>
          <div class="flex items-center gap-3 mt-2">
            <input
              v-model.number="form.maxBudget"
              type="range"
              min="15000"
              max="60000"
              step="1000"
              class="flex-1"
            >
            <span class="font-num text-sm w-24 text-right">{{ formatEuro(form.maxBudget) }}</span>
          </div>
        </label>

        <label class="flex items-center gap-2 sm:col-span-2">
          <input v-model="form.hasHomeCharging" type="checkbox" class="h-4 w-4">
          <span class="text-sm font-medium text-ink">
            Je peux recharger à domicile (impacte le coût des électriques)
          </span>
        </label>
      </section>

      <section v-if="cheapest" class="card card-pad mb-6" style="background: linear-gradient(180deg, #ffffff 0%, #fafaf9 100%);">
        <div class="text-sm text-ink-subtle uppercase tracking-wide mb-2">
          Le moins cher pour ton profil
        </div>
        <div class="text-2xl sm:text-3xl font-semibold mb-1">
          {{ cheapest.vehicle.label }}
        </div>
        <div class="text-ink-muted">
          <span class="font-num font-medium text-accent">{{ formatEuro(cheapest.totalCost) }}</span>
          sur {{ form.durationYears }} ans —
          <span class="font-num">{{ formatEuro(cheapest.monthlyEquivalent) }}/mois</span>
        </div>
      </section>

      <section class="card card-pad">
        <h2 class="text-base font-semibold mb-4">
          Classement complet ({{ ranking.length }} modèles)
        </h2>
        <p v-if="ranking.length === 0" class="text-sm text-ink-muted">
          Aucun modèle sous ce budget. Augmente le budget d'achat max.
        </p>
        <ol v-else class="space-y-1">
          <li
            v-for="(item, index) in ranking"
            :key="item.vehicle.id"
            class="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
            :class="index === 0 ? 'bg-accent-soft' : 'odd:bg-canvas'"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-num text-sm text-ink-subtle w-6 shrink-0">{{ index + 1 }}</span>
              <span class="text-sm font-medium text-ink truncate" :class="{ 'text-accent': index === 0 }">
                {{ item.vehicle.label }}
              </span>
            </div>
            <div class="text-right shrink-0">
              <span class="font-num text-sm font-medium">{{ formatEuro(item.totalCost) }}</span>
              <span class="text-xs text-ink-subtle ml-2">{{ formatEuro(item.monthlyEquivalent) }}/mois</span>
            </div>
          </li>
        </ol>
      </section>

      <p class="text-center text-sm text-ink-muted mt-8">
        Envie d'affiner ?
        <RouterLink to="/" class="text-accent font-medium hover:underline">
          Compare deux modèles en détail
        </RouterLink>.
      </p>
    </main>

    <footer class="border-t border-line py-4 text-center text-xs text-ink-subtle">
      Car TCO Simulator · open data : data.gouv.fr · ADEME
    </footer>
  </div>
</template>
