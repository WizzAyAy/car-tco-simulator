<script setup lang="ts">
import type { Energy, PurchaseCondition, Vehicle } from '@cts/shared'
import { computed } from 'vue'
import ListingLinksDropdown from '~/features/ListingLinksDropdown.vue'
import VehiclePicker from '~/features/VehiclePicker.vue'

const props = defineProps<{
  vehicle: Vehicle
  side: 'A' | 'B'
  condition: PurchaseCondition
  totalCost: number
  perMonth: number
  perKm: number
  accentClass: string
}>()

const emit = defineEmits<{
  (e: 'update:vehicle', v: Vehicle): void
  (e: 'selectPreset', id: string): void
  (e: 'setCondition', c: PurchaseCondition): void
}>()

const ENERGY_LABELS: Record<Energy, string> = {
  gasoline: 'Essence',
  diesel: 'Diesel',
  hybrid: 'Hybride',
  phev: 'Hybride rechargeable',
  electric: 'Électrique',
}

const energyLabel = computed(() => ENERGY_LABELS[props.vehicle.energy])

const consumptionUnit = computed(() => (props.vehicle.energy === 'electric' ? 'kWh/100km' : 'L/100km'))

const conditionOptions: { value: PurchaseCondition, label: string, sub: string }[] = [
  { value: 'new', label: 'Neuf', sub: '0 km' },
  { value: 'usedRecent', label: 'Occasion récente', sub: '~ 3 ans' },
  { value: 'usedOld', label: 'Occasion ancienne', sub: '~ 6 ans' },
]

function update<K extends keyof Vehicle>(key: K, value: Vehicle[K]) {
  emit('update:vehicle', { ...props.vehicle, [key]: value })
}
</script>

<template>
  <div class="card card-pad">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="badge" :class="accentClass">Voiture {{ side }}</span>
          <span class="text-xs text-ink-subtle uppercase tracking-wide">{{ energyLabel }}</span>
          <span
            v-if="vehicle.wltpRangeKm && (vehicle.energy === 'electric' || vehicle.energy === 'phev')"
            class="badge badge-accent text-[11px]"
            :title="vehicle.energy === 'phev' ? 'Autonomie 100% électrique (mode EV pur)' : 'Autonomie WLTP officielle'"
          >
            {{ vehicle.energy === 'phev' ? '🔌' : '⚡' }} {{ vehicle.wltpRangeKm }} km
          </span>
          <span v-if="vehicle.isArchetype" class="badge text-[11px] uppercase tracking-wide">Archétype</span>
        </div>
        <h2 class="text-lg font-semibold leading-tight">
          {{ vehicle.label }}
        </h2>
      </div>
      <div class="text-right">
        <div class="text-2xl font-num font-semibold leading-none">
          {{ Math.round(totalCost).toLocaleString('fr-FR') }} €
        </div>
        <div class="text-xs text-ink-subtle mt-1 font-num">
          {{ Math.round(perMonth).toLocaleString('fr-FR') }} €/mois
          · {{ perKm.toFixed(2) }} €/km
        </div>
      </div>
    </div>

    <div v-if="!vehicle.isArchetype" class="flex items-center justify-between mb-3">
      <ListingLinksDropdown :vehicle="vehicle" :condition="condition" />
    </div>
    <p v-else class="text-xs text-ink-subtle mb-3">
      Archétype de segment — specs et prix médians des modèles réels de la catégorie.
    </p>

    <VehiclePicker :model-value="vehicle.id" @update:model-value="(id) => emit('selectPreset', id)" />

    <label class="label"><span>État du véhicule</span></label>
    <div class="grid grid-cols-3 gap-2 mb-4">
      <button
        v-for="opt in conditionOptions"
        :key="opt.value"
        type="button"
        class="px-2 py-2 rounded-md border text-left transition-colors"
        :class="condition === opt.value
          ? 'border-ink bg-ink text-canvas-elevated'
          : 'border-line bg-canvas hover:border-ink/40'"
        @click="emit('setCondition', opt.value)"
      >
        <div class="text-xs font-medium leading-tight">
          {{ opt.label }}
        </div>
        <div class="text-[10px] opacity-70 mt-0.5 font-num">
          {{ opt.sub }}
        </div>
      </button>
    </div>

    <details class="group">
      <summary class="cursor-pointer text-sm text-ink-muted hover:text-ink select-none flex items-center gap-2">
        <span class="i-arrow group-open:rotate-90 transition-transform inline-block">›</span>
        Personnaliser ce véhicule
      </summary>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div class="label">
            Prix d'achat (€)
          </div>
          <input
            type="number"
            class="input-base font-num"
            :value="vehicle.purchasePrice"
            @input="update('purchasePrice', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="label">
            Conso ({{ consumptionUnit }})
          </div>
          <input
            type="number"
            step="0.1"
            class="input-base font-num"
            :value="vehicle.consumption"
            @input="update('consumption', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="label">
            Entretien (€/an)
          </div>
          <input
            type="number"
            class="input-base font-num"
            :value="vehicle.maintenanceAnnual"
            @input="update('maintenanceAnnual', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="label">
            Cat. assurance
          </div>
          <input
            type="number"
            min="1"
            max="50"
            class="input-base font-num"
            :value="vehicle.insuranceCategory"
            @input="update('insuranceCategory', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="label">
            Malus écologique (€)
          </div>
          <input
            type="number"
            class="input-base font-num"
            :value="vehicle.malus"
            @input="update('malus', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <div class="label">
            Bonus écologique (€)
          </div>
          <input
            type="number"
            class="input-base font-num"
            :value="vehicle.bonus"
            @input="update('bonus', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
      </div>
      <p v-if="condition !== 'new'" class="text-xs text-ink-subtle mt-3">
        Sur occasion, le malus écologique est en général déjà payé par le 1<sup>er</sup> propriétaire.
        Certaines primes restent accessibles (prime à la conversion VE occasion, aides régionales) —
        ajuste manuellement le champ <span class="font-medium">Bonus</span> selon ton éligibilité.
      </p>
    </details>
  </div>
</template>
