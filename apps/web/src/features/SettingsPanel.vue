<script setup lang="ts">
import { useSimulationStore } from '~/stores/simulation'
import SliderInput from '~/components/SliderInput.vue'
import { formatYears } from '~/composables/useFormatters'

const store = useSimulationStore()
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-4">Paramètres de simulation</h3>

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
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="store.financingEnabled" type="checkbox" class="accent-ink" />
          <span>Financement (crédit auto)</span>
        </label>
        <div v-if="store.financingEnabled" class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-subtle">Apport (€)</label>
            <input
              v-model.number="store.financingDownPayment"
              type="number"
              class="input-base font-num mt-1"
            />
          </div>
          <div>
            <label class="text-xs text-ink-subtle">TAEG (%)</label>
            <input
              v-model.number="store.financingApr"
              type="number"
              step="0.1"
              class="input-base font-num mt-1"
            />
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
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="store.includeCarbonExternality" type="checkbox" class="accent-ink" />
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
