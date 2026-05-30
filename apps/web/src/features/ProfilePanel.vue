<script setup lang="ts">
import type { TripMix } from '@cts/shared'
import { computed, ref } from 'vue'
import SliderInput from '~/components/SliderInput.vue'
import { formatEuro, formatKm } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()

interface TripProfile {
  id: string
  label: string
  mix: TripMix
}

const TRIP_PROFILES: readonly TripProfile[] = [
  { id: 'city', label: 'Ville', mix: { urban: 0.7, road: 0.25, highway: 0.05 } },
  { id: 'mixed', label: 'Mixte', mix: { urban: 0.45, road: 0.35, highway: 0.2 } },
  { id: 'road', label: 'Route', mix: { urban: 0.25, road: 0.5, highway: 0.25 } },
  { id: 'highway', label: 'Autoroute', mix: { urban: 0.15, road: 0.25, highway: 0.6 } },
]

const activeProfileId = computed(() => {
  const m = store.profile.tripMix
  const found = TRIP_PROFILES.find(p =>
    Math.abs(p.mix.urban - m.urban) < 0.03
    && Math.abs(p.mix.road - m.road) < 0.03
    && Math.abs(p.mix.highway - m.highway) < 0.03,
  )
  return found?.id ?? null
})

const showCustom = ref(activeProfileId.value === null)

function setTripProfile(mix: TripMix) {
  store.profile.tripMix = { ...mix }
}

function normalizeTrips(field: 'urban' | 'road' | 'highway', newValue: number) {
  const mix = { ...store.profile.tripMix, [field]: newValue }
  const sum = mix.urban + mix.road + mix.highway
  if (sum === 0)
    return
  store.profile.tripMix = {
    urban: mix.urban / sum,
    road: mix.road / sum,
    highway: mix.highway / sum,
  }
}
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-4 flex items-center gap-2">
      <span>Profil conducteur</span>
      <span class="text-xs font-normal text-ink-subtle">influence assurance, carburant, dépréciation</span>
    </h3>

    <div class="space-y-5">
      <SliderInput
        v-model="store.profile.annualKm"
        :min="3000"
        :max="50000"
        :step="500"
        label="Kilométrage annuel"
        :display="(v) => formatKm(v)"
      />

      <div>
        <div class="label flex items-center justify-between">
          <span>Type de trajet</span>
          <button
            type="button"
            class="text-xs font-normal text-ink-subtle hover:text-ink transition-colors"
            @click="showCustom = !showCustom"
          >
            {{ showCustom ? 'Masquer' : 'Ajuster finement' }}
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="p in TRIP_PROFILES"
            :key="p.id"
            class="btn btn-ghost text-xs px-2 py-1.5 min-h-11"
            :class="activeProfileId === p.id ? '!bg-accent !text-[#04150d] !border-transparent !font-semibold' : ''"
            @click="setTripProfile(p.mix)"
          >
            {{ p.label }}
          </button>
        </div>
        <p v-if="activeProfileId === null" class="text-xs text-ink-subtle mt-2">
          Personnalisé : {{ Math.round(store.profile.tripMix.urban * 100) }}% ville ·
          {{ Math.round(store.profile.tripMix.road * 100) }}% route ·
          {{ Math.round(store.profile.tripMix.highway * 100) }}% autoroute
        </p>

        <div v-if="showCustom" class="grid grid-cols-3 gap-2 mt-3">
          <SliderInput
            :model-value="Math.round(store.profile.tripMix.urban * 100)"
            :min="0"
            :max="100"
            :step="5"
            label="Urbain"
            unit="%"
            @update:model-value="(v) => normalizeTrips('urban', v / 100)"
          />
          <SliderInput
            :model-value="Math.round(store.profile.tripMix.road * 100)"
            :min="0"
            :max="100"
            :step="5"
            label="Route"
            unit="%"
            @update:model-value="(v) => normalizeTrips('road', v / 100)"
          />
          <SliderInput
            :model-value="Math.round(store.profile.tripMix.highway * 100)"
            :min="0"
            :max="100"
            :step="5"
            label="Autoroute"
            unit="%"
            @update:model-value="(v) => normalizeTrips('highway', v / 100)"
          />
        </div>
      </div>

      <div>
        <div class="label">
          Conducteur
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-subtle">Âge</label>
            <input
              v-model.number="store.profile.driverAge"
              type="number"
              min="18"
              max="90"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Bonus-malus (CRM)</label>
            <input
              v-model.number="store.profile.bonusMalus"
              type="number"
              step="0.01"
              min="0.5"
              max="3.5"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
        </div>
      </div>

      <div>
        <div class="label">
          Formule d'assurance
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="tier in (['thirdParty', 'thirdPartyPlus', 'comprehensive'] as const)"
            :key="tier"
            class="btn btn-ghost text-xs px-2 py-1.5 min-h-11"
            :class="store.profile.insuranceTier === tier ? '!bg-accent !text-[#04150d] !border-transparent !font-semibold' : ''"
            @click="store.profile.insuranceTier = tier"
          >
            {{ tier === 'thirdParty' ? 'Tiers' : tier === 'thirdPartyPlus' ? 'Tiers+' : 'Tous risques' }}
          </button>
        </div>
      </div>

      <div>
        <div class="label">
          Prix carburants & électricité
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-subtle">Essence (€/L)</label>
            <input
              v-model.number="store.profile.gasolinePricePerLiter"
              type="number"
              step="0.01"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Diesel (€/L)</label>
            <input
              v-model.number="store.profile.dieselPricePerLiter"
              type="number"
              step="0.01"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Élec maison (€/kWh)</label>
            <input
              v-model.number="store.profile.electricityHomePricePerKwh"
              type="number"
              step="0.0001"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Élec borne rapide (€/kWh)</label>
            <input
              v-model.number="store.profile.electricityFastPricePerKwh"
              type="number"
              step="0.01"
              class="input-base font-num mt-1 min-h-11"
            >
          </div>
        </div>
      </div>

      <div>
        <div class="label">
          Recharge électrique
        </div>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="store.profile.hasHomeCharging" type="checkbox" class="accent-[#34e89e]">
          Je peux recharger à domicile
        </label>
        <div v-if="store.profile.hasHomeCharging" class="mt-3">
          <SliderInput
            :model-value="Math.round(store.profile.homeChargingMix.home * 100)"
            :min="0"
            :max="100"
            :step="5"
            label="Part de recharge à domicile"
            unit="%"
            :hint="`${Math.round(store.profile.homeChargingMix.fastStation * 100)}% en borne rapide`"
            @update:model-value="(v) => store.profile.homeChargingMix = { home: v / 100, fastStation: 1 - v / 100 }"
          />
        </div>
      </div>

      <div>
        <div class="label">
          Stationnement
        </div>
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button
            v-for="t in (['garage', 'street', 'paidParking'] as const)"
            :key="t"
            class="btn btn-ghost text-xs px-2 py-1.5 min-h-11"
            :class="store.profile.parkingType === t ? '!bg-accent !text-[#04150d] !border-transparent !font-semibold' : ''"
            @click="store.profile.parkingType = t"
          >
            {{ t === 'garage' ? 'Garage' : t === 'street' ? 'Rue' : 'Payant' }}
          </button>
        </div>
        <div v-if="store.profile.parkingType === 'paidParking'">
          <input
            v-model.number="store.profile.paidParkingMonthly"
            type="number"
            class="input-base font-num min-h-11"
            :placeholder="`${formatEuro(store.profile.paidParkingMonthly)}/mois`"
          >
        </div>
      </div>
    </div>
  </div>
</template>
