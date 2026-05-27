<script setup lang="ts">
import type { AcquisitionMode } from '@cts/shared'
import SliderInput from '~/components/SliderInput.vue'
import { formatYears } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()

const ACQUISITION_MODES: { value: AcquisitionMode, label: string }[] = [
  { value: 'cash', label: 'Comptant' },
  { value: 'credit', label: 'Crédit' },
  { value: 'leasing', label: 'LOA / LLD' },
]
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-4">
      Paramètres de simulation
    </h3>

    <div class="space-y-5">
      <SliderInput
        v-model="store.durationYears"
        :min="1"
        :max="15"
        :step="1"
        label="Durée de détention"
        :display="(v) => formatYears(v)"
      />

      <div>
        <label class="text-xs text-ink-subtle">Mode d'acquisition</label>
        <div class="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-canvas p-1">
          <button
            v-for="opt in ACQUISITION_MODES"
            :key="opt.value"
            type="button"
            class="text-xs py-1.5 rounded-md transition-colors"
            :class="store.acquisitionMode === opt.value ? 'bg-surface font-medium shadow-sm' : 'text-ink-subtle hover:text-ink'"
            @click="store.acquisitionMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div v-if="store.acquisitionMode === 'credit'" class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-subtle">Apport (€)</label>
            <input
              v-model.number="store.financingDownPayment"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">TAEG (%)</label>
            <input
              v-model.number="store.financingApr"
              type="number"
              step="0.1"
              class="input-base font-num mt-1"
            >
          </div>
          <div class="col-span-2">
            <SliderInput
              v-model="store.financingTermYears"
              :min="1"
              :max="8"
              :step="1"
              label="Durée du crédit"
              :display="(v) => formatYears(v)"
            />
          </div>
        </div>

        <div v-else-if="store.acquisitionMode === 'leasing'" class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-subtle">Apport / 1er loyer (€)</label>
            <input
              v-model.number="store.leasingInitialDeposit"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Loyer mensuel (€)</label>
            <input
              v-model.number="store.leasingMonthlyRent"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Durée (mois)</label>
            <input
              v-model.number="store.leasingTermMonths"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Forfait km / an</label>
            <input
              v-model.number="store.leasingMileageCapPerYear"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
          <div>
            <label class="text-xs text-ink-subtle">Surcoût km dépassé (€)</label>
            <input
              v-model.number="store.leasingOverageCostPerKm"
              type="number"
              step="0.01"
              class="input-base font-num mt-1"
            >
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 text-sm cursor-pointer pb-2">
              <input v-model="store.leasingBuyOption" type="checkbox" class="accent-ink">
              <span>Option d'achat (LOA)</span>
            </label>
          </div>
          <div v-if="store.leasingBuyOption" class="col-span-2">
            <label class="text-xs text-ink-subtle">Prix de l'option d'achat (€)</label>
            <input
              v-model.number="store.leasingBuyOptionPrice"
              type="number"
              class="input-base font-num mt-1"
            >
          </div>
        </div>
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="store.includeCarbonExternality" type="checkbox" class="accent-ink">
          <span>Inclure le coût social du carbone</span>
        </label>
        <div v-if="store.includeCarbonExternality" class="mt-2">
          <SliderInput
            v-model="store.carbonPricePerTon"
            :min="30"
            :max="300"
            :step="10"
            label="Prix du carbone"
            unit=" €/t CO₂"
          />
        </div>
      </div>
    </div>
  </div>
</template>
