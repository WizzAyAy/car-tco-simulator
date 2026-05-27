<script setup lang="ts">
import type { TCOInput } from '@cts/shared'
import { findBreakEvenAnnualKm } from '@cts/shared'
import { computed } from 'vue'
import { formatKm } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()

function buildInput(which: 'a' | 'b'): TCOInput {
  const vehicle = which === 'a' ? store.vehicleA : store.vehicleB
  const condition = which === 'a' ? store.conditionA : store.conditionB
  return {
    vehicle,
    profile: store.profile,
    durationYears: store.durationYears,
    purchaseCondition: condition,
    financing: {
      enabled: store.financingEnabled,
      downPayment: store.financingDownPayment,
      aprPercent: store.financingApr,
      termYears: store.financingTermYears,
    },
    includeCarbonExternality: store.includeCarbonExternality,
    carbonPricePerTon: store.carbonPricePerTon,
    inflationPercent: store.inflationPercent,
    energyInflationPercent: store.energyInflationPercent,
  }
}

const breakEven = computed(() => findBreakEvenAnnualKm(buildInput('a'), buildInput('b')))

const winnerBeyondLabel = computed(() =>
  breakEven.value?.winnerBeyond === 'a' ? store.vehicleA.label : store.vehicleB.label,
)
const winnerBelowLabel = computed(() =>
  breakEven.value?.winnerBelow === 'a' ? store.vehicleA.label : store.vehicleB.label,
)

const currentKm = computed(() => store.profile.annualKm)
const isCurrentlyAbove = computed(() =>
  breakEven.value !== null && currentKm.value >= breakEven.value.annualKm,
)
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-1">Point de bascule</h3>
    <p class="text-xs text-ink-subtle mb-4">
      Le kilométrage annuel à partir duquel la voiture la moins chère change.
    </p>

    <div v-if="breakEven" class="space-y-3">
      <div class="flex items-baseline gap-2 flex-wrap">
        <span class="text-3xl sm:text-4xl font-semibold font-num text-accent leading-none">
          {{ formatKm(breakEven.annualKm) }}/an
        </span>
      </div>
      <p class="text-sm text-ink">
        <span class="font-semibold">{{ winnerBeyondLabel }}</span>
        devient l'option la moins chère au-delà de
        <span class="font-num font-medium">{{ formatKm(breakEven.annualKm) }}/an</span>.
        En-deçà, c'est <span class="font-semibold">{{ winnerBelowLabel }}</span> qui l'emporte.
      </p>
      <div
        class="badge"
        :class="isCurrentlyAbove ? 'badge-accent' : ''"
      >
        Profil actuel : {{ formatKm(currentKm) }}/an —
        {{ isCurrentlyAbove ? 'au-dessus' : 'en-dessous' }} du seuil
      </div>
    </div>

    <div v-else class="py-4 text-sm text-ink-muted">
      Sur la plage testée (2 000 à 60 000 km/an), la même voiture reste toujours
      la moins chère : le kilométrage ne renverse pas le verdict.
    </div>
  </div>
</template>
