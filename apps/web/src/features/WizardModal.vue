<script setup lang="ts">
import type { ChargingAccess, DominantTrip, EcoPriority, FamilySize, LifestyleProfile, PurchaseCondition, ScoredVehicle, Vehicle } from '@cts/shared'
import { DEFAULT_LIFESTYLE, estimateUsedPrice, findPresetById, findTraditionalComparator, rankVehicles, VEHICLE_PRESETS } from '@cts/shared'
import { computed, ref, watch } from 'vue'
import SliderInput from '~/components/SliderInput.vue'
import { formatEuro, formatKm } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useSimulationStore()
const step = ref(0)
const profile = ref<LifestyleProfile>({ ...DEFAULT_LIFESTYLE })
const pickedId = ref<string | null>(null)

const totalSteps = 6

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    step.value = 0
    pickedId.value = null
  }
})

const results = computed<ScoredVehicle[]>(() => {
  if (step.value < totalSteps)
    return []
  return rankVehicles(VEHICLE_PRESETS, profile.value, 6)
})

const pickedVehicle = computed<Vehicle | null>(() =>
  pickedId.value ? findPresetById(pickedId.value) ?? null : null,
)

const comparator = computed<Vehicle | null>(() =>
  pickedVehicle.value ? findTraditionalComparator(pickedVehicle.value, VEHICLE_PRESETS) : null,
)

function suggestCondition(vehicle: Vehicle, budget: number): PurchaseCondition {
  if (vehicle.purchasePrice <= budget)
    return 'new'
  if (estimateUsedPrice(vehicle, 'usedRecent') <= budget)
    return 'usedRecent'
  return 'usedOld'
}

function effectivePrice(vehicle: Vehicle, condition: PurchaseCondition): number {
  return condition === 'new' ? vehicle.purchasePrice : estimateUsedPrice(vehicle, condition)
}

function conditionLabel(c: PurchaseCondition): string {
  switch (c) {
    case 'new': return 'neuf'
    case 'usedRecent': return 'occasion ~3 ans'
    case 'usedOld': return 'occasion ~6 ans'
  }
}

const pickedCondition = computed<PurchaseCondition | null>(() =>
  pickedVehicle.value ? suggestCondition(pickedVehicle.value, profile.value.budgetMaxEur) : null,
)
const comparatorCondition = computed<PurchaseCondition | null>(() =>
  comparator.value ? suggestCondition(comparator.value, profile.value.budgetMaxEur) : null,
)

function energyLabelShort(energy: Vehicle['energy']): string {
  switch (energy) {
    case 'gasoline': return 'essence'
    case 'diesel': return 'diesel'
    case 'hybrid': return 'hybride'
    case 'phev': return 'hybride rechargeable'
    case 'electric': return 'électrique'
  }
}

function applyAndClose() {
  if (pickedVehicle.value && pickedCondition.value) {
    store.selectPresetA(pickedVehicle.value.id)
    store.setConditionA(pickedCondition.value)
  }
  if (comparator.value && comparatorCondition.value) {
    store.selectPresetB(comparator.value.id)
    store.setConditionB(comparatorCondition.value)
  }
  store.profile.annualKm = profile.value.annualKm
  if (profile.value.charging === 'wallbox' || profile.value.charging === 'standardPlug') {
    store.profile.hasHomeCharging = true
    store.profile.homeChargingMix = {
      home: profile.value.charging === 'wallbox' ? 0.9 : 0.7,
      fastStation: profile.value.charging === 'wallbox' ? 0.1 : 0.3,
    }
  }
  else {
    store.profile.hasHomeCharging = false
    store.profile.homeChargingMix = { home: 0, fastStation: 1 }
  }
  emit('close')
}

function next() {
  if (step.value < totalSteps)
    step.value++
}
function prev() {
  if (step.value > 0)
    step.value--
}

const familyOptions: { value: FamilySize, label: string, hint: string }[] = [
  { value: 'solo', label: 'Solo', hint: '1 personne' },
  { value: 'couple', label: 'Couple', hint: '2 adultes' },
  { value: 'family', label: 'Famille', hint: '1-2 enfants' },
  { value: 'largeFamily', label: 'Grande famille', hint: '3+ enfants ou besoin de coffre' },
]

const tripOptions: { value: DominantTrip, label: string, hint: string }[] = [
  { value: 'urban', label: 'Urbain', hint: 'Ville, petits trajets, bouchons' },
  { value: 'mixed', label: 'Mixte', hint: 'Ville + route, polyvalent' },
  { value: 'highway', label: 'Autoroute', hint: 'Beaucoup de longs trajets rapides' },
]

const chargingOptions: { value: ChargingAccess, label: string, hint: string }[] = [
  { value: 'wallbox', label: 'Wallbox', hint: 'Borne dédiée installée à domicile' },
  { value: 'standardPlug', label: 'Prise standard', hint: 'Prise normale 230V au garage / parking' },
  { value: 'none', label: 'Aucune', hint: 'Pas de recharge possible chez moi' },
]

const ecoOptions: { value: EcoPriority, label: string, hint: string }[] = [
  { value: 'top', label: 'Priorité', hint: 'Je veux minimiser mon empreinte' },
  { value: 'important', label: 'Importante', hint: 'Ça compte, sans être bloquant' },
  { value: 'neutral', label: 'Neutre', hint: 'Pas un critère décisif' },
]
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="card-pad border-b border-line flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              Trouve la voiture qui te correspond
            </h2>
            <p class="text-xs text-ink-subtle">
              {{ step < totalSteps ? `Étape ${step + 1} sur ${totalSteps}` : 'Recommandations personnalisées' }}
            </p>
          </div>
          <button class="text-ink-subtle hover:text-ink text-xl leading-none" @click="emit('close')">
            ×
          </button>
        </div>

        <!-- Progress bar -->
        <div class="h-1 bg-line">
          <div
            class="h-full bg-ink transition-all duration-300"
            :style="{ width: `${(step / totalSteps) * 100}%` }"
          />
        </div>

        <div class="card-pad">
          <!-- Step 0: km/year -->
          <div v-if="step === 0">
            <h3 class="text-base font-semibold mb-2">
              Combien tu roules par an ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              C'est le levier numéro 1 : à fort kilométrage, l'électrique et le diesel deviennent intéressants ;
              à faible km, une essence neuve ou occasion bien choisie peut suffire.
            </p>
            <SliderInput
              v-model="profile.annualKm"
              :min="3000"
              :max="50000"
              :step="500"
              label="Kilométrage annuel"
              :display="(v) => formatKm(v)"
            />
          </div>

          <!-- Step 1: dominant trip + commute -->
          <div v-else-if="step === 1">
            <h3 class="text-base font-semibold mb-2">
              Quel type de trajets domine ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              L'urbain favorise hybride/EV, l'autoroute pénalise l'EV (surconsommation à 130 km/h)
              et favorise le diesel ou l'hybride essence.
            </p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="opt in tripOptions"
                :key="opt.value"
                type="button"
                class="text-left p-3 rounded-md border transition-colors"
                :class="profile.dominantTrip === opt.value
                  ? 'border-ink bg-ink text-canvas-elevated'
                  : 'border-line bg-canvas hover:border-ink/40'"
                @click="profile.dominantTrip = opt.value"
              >
                <div class="font-medium text-sm">
                  {{ opt.label }}
                </div>
                <div class="text-xs opacity-80 mt-0.5">
                  {{ opt.hint }}
                </div>
              </button>
            </div>

            <div class="mt-5">
              <SliderInput
                v-model="profile.commuteOneWayKm"
                :min="0"
                :max="120"
                :step="1"
                label="Distance maison ↔ travail (sens unique)"
                :display="(v) => formatKm(v)"
                :hint="`Aller-retour quotidien : ${formatKm(profile.commuteOneWayKm * 2)}`"
              />
            </div>
          </div>

          <!-- Step 2: family -->
          <div v-else-if="step === 2">
            <h3 class="text-base font-semibold mb-2">
              Tu transportes qui ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              Détermine le format minimum acceptable (citadine, compacte, break, SUV…).
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in familyOptions"
                :key="opt.value"
                type="button"
                class="text-left p-3 rounded-md border transition-colors"
                :class="profile.family === opt.value
                  ? 'border-ink bg-ink text-canvas-elevated'
                  : 'border-line bg-canvas hover:border-ink/40'"
                @click="profile.family = opt.value"
              >
                <div class="font-medium text-sm">
                  {{ opt.label }}
                </div>
                <div class="text-xs opacity-80 mt-0.5">
                  {{ opt.hint }}
                </div>
              </button>
            </div>
          </div>

          <!-- Step 3: charging -->
          <div v-else-if="step === 3">
            <h3 class="text-base font-semibold mb-2">
              Tu peux recharger chez toi ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              Sans recharge maison, un EV devient nettement moins attractif (recharge en borne publique = +50 % à +100 % du tarif).
            </p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="opt in chargingOptions"
                :key="opt.value"
                type="button"
                class="text-left p-3 rounded-md border transition-colors"
                :class="profile.charging === opt.value
                  ? 'border-ink bg-ink text-canvas-elevated'
                  : 'border-line bg-canvas hover:border-ink/40'"
                @click="profile.charging = opt.value"
              >
                <div class="font-medium text-sm">
                  {{ opt.label }}
                </div>
                <div class="text-xs opacity-80 mt-0.5">
                  {{ opt.hint }}
                </div>
              </button>
            </div>
          </div>

          <!-- Step 4: budget -->
          <div v-else-if="step === 4">
            <h3 class="text-base font-semibold mb-2">
              Quel est ton budget d'achat ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              Montant maximum que tu es prêt à mettre pour l'achat. On te proposera des modèles
              qui tiennent ce budget en neuf, mais aussi des modèles plus chers accessibles en occasion.
            </p>
            <SliderInput
              v-model="profile.budgetMaxEur"
              :min="8000"
              :max="80000"
              :step="500"
              label="Budget plafond"
              :display="(v) => formatEuro(v)"
            />
          </div>

          <!-- Step 5: eco priority -->
          <div v-else-if="step === 5">
            <h3 class="text-base font-semibold mb-2">
              L'écologie pèse combien dans ta décision ?
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              Ça module le scoring entre énergies. Au-delà du critère, garde en tête qu'une EV n'est
              "verte" que si tu peux la garder longtemps.
            </p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="opt in ecoOptions"
                :key="opt.value"
                type="button"
                class="text-left p-3 rounded-md border transition-colors"
                :class="profile.ecoPriority === opt.value
                  ? 'border-ink bg-ink text-canvas-elevated'
                  : 'border-line bg-canvas hover:border-ink/40'"
                @click="profile.ecoPriority = opt.value"
              >
                <div class="font-medium text-sm">
                  {{ opt.label }}
                </div>
                <div class="text-xs opacity-80 mt-0.5">
                  {{ opt.hint }}
                </div>
              </button>
            </div>
          </div>

          <!-- Final: results -->
          <div v-else-if="step === totalSteps">
            <h3 class="text-base font-semibold mb-2">
              Top {{ results.length }} pour ton profil
            </h3>
            <p class="text-sm text-ink-muted mb-4">
              Choisis <strong>la voiture qui te plaît</strong>. On la comparera automatiquement à son équivalent thermique dans la même catégorie.
            </p>

            <div v-if="results.length === 0" class="text-sm text-ink-subtle">
              Aucun véhicule ne correspond à ce profil. Augmente le budget.
            </div>

            <div class="space-y-2">
              <button
                v-for="(r, idx) in results"
                :key="r.vehicle.id"
                type="button"
                class="w-full text-left p-3 rounded-md border transition-colors"
                :class="pickedId === r.vehicle.id
                  ? 'border-accent bg-accent-soft'
                  : 'border-line hover:border-ink/40 bg-canvas-elevated'"
                @click="pickedId = pickedId === r.vehicle.id ? null : r.vehicle.id"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="text-[11px] font-num font-medium text-ink-subtle">#{{ idx + 1 }}</span>
                      <span class="font-medium text-sm">{{ r.vehicle.label }}</span>
                      <span
                        v-if="pickedId === r.vehicle.id"
                        class="badge badge-accent text-[10px]"
                      >Sélectionnée</span>
                    </div>
                    <div class="text-xs text-ink-muted font-num">
                      <template v-if="r.vehicle.purchasePrice > profile.budgetMaxEur">
                        <span class="line-through text-ink-subtle">{{ formatEuro(r.vehicle.purchasePrice) }} neuf</span>
                        →
                        <span class="font-medium text-ink">{{ formatEuro(effectivePrice(r.vehicle, suggestCondition(r.vehicle, profile.budgetMaxEur))) }} en occasion</span>
                      </template>
                      <template v-else>
                        {{ formatEuro(r.vehicle.purchasePrice) }}
                      </template>
                      ·
                      {{ r.vehicle.energy === 'electric' ? '⚡' : r.vehicle.energy === 'phev' ? '🔌' : r.vehicle.energy === 'hybrid' ? '🍃' : '⛽' }}
                      {{ r.vehicle.wltpRangeKm ? `· ${r.vehicle.wltpRangeKm} km` : '' }}
                    </div>
                    <ul v-if="r.reasons.length" class="mt-2 text-[12px] text-ink-muted space-y-0.5">
                      <li v-for="reason in r.reasons.slice(0, 3)" :key="reason" class="flex items-start gap-1.5">
                        <span class="text-accent leading-none mt-0.5">+</span>
                        <span>{{ reason }}</span>
                      </li>
                    </ul>
                    <ul v-if="r.warnings.length" class="mt-1 text-[12px] text-warn space-y-0.5">
                      <li v-for="w in r.warnings.slice(0, 2)" :key="w" class="flex items-start gap-1.5">
                        <span class="leading-none mt-0.5">!</span>
                        <span>{{ w }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="text-right">
                    <div class="text-xl font-num font-semibold">
                      {{ r.score }}
                    </div>
                    <div class="text-[10px] text-ink-subtle uppercase">
                      score
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <!-- Preview du duel -->
            <div v-if="pickedVehicle && comparator && pickedCondition && comparatorCondition" class="mt-5 p-4 rounded-md border border-line bg-canvas">
              <div class="text-xs text-ink-subtle uppercase tracking-wide mb-2">
                Aperçu de la comparaison
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center text-sm">
                <div>
                  <div class="text-[11px] text-ink-subtle">
                    Voiture A — ton choix
                  </div>
                  <div class="font-medium leading-tight">
                    {{ pickedVehicle.label }}
                  </div>
                  <div class="text-xs text-ink-muted font-num">
                    {{ formatEuro(effectivePrice(pickedVehicle, pickedCondition)) }}
                    · {{ energyLabelShort(pickedVehicle.energy) }}
                    · <span class="font-medium text-ink">{{ conditionLabel(pickedCondition) }}</span>
                  </div>
                  <div v-if="pickedCondition !== 'new'" class="text-[11px] text-ink-subtle mt-0.5">
                    prix neuf de référence : {{ formatEuro(pickedVehicle.purchasePrice) }}
                  </div>
                </div>
                <div class="text-center text-ink-subtle">
                  vs
                </div>
                <div>
                  <div class="text-[11px] text-ink-subtle">
                    Voiture B — équivalent thermique
                  </div>
                  <div class="font-medium leading-tight">
                    {{ comparator.label }}
                  </div>
                  <div class="text-xs text-ink-muted font-num">
                    {{ formatEuro(effectivePrice(comparator, comparatorCondition)) }}
                    · {{ energyLabelShort(comparator.energy) }}
                    · <span class="font-medium text-ink">{{ conditionLabel(comparatorCondition) }}</span>
                  </div>
                  <div v-if="comparatorCondition !== 'new'" class="text-[11px] text-ink-subtle mt-0.5">
                    prix neuf de référence : {{ formatEuro(comparator.purchasePrice) }}
                  </div>
                </div>
              </div>
              <p class="text-[11px] text-ink-subtle mt-3 leading-relaxed">
                On part en {{ conditionLabel(pickedCondition) }} / {{ conditionLabel(comparatorCondition) }}
                pour que le prix d'achat corresponde à ton budget de {{ formatEuro(profile.budgetMaxEur) }}.
                Tu pourras toujours rebasculer en neuf depuis la page de comparaison.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer with navigation -->
        <div class="card-pad border-t border-line flex items-center justify-between gap-2">
          <button
            v-if="step > 0 && step < totalSteps"
            class="btn btn-ghost text-sm"
            @click="prev"
          >
            ← Précédent
          </button>
          <button
            v-else-if="step === totalSteps"
            class="btn btn-ghost text-sm"
            @click="step = 0"
          >
            Refaire le questionnaire
          </button>
          <div v-else />

          <button
            v-if="step < totalSteps"
            class="btn btn-primary text-sm"
            @click="next"
          >
            {{ step === totalSteps - 1 ? 'Voir mes recommandations' : 'Suivant →' }}
          </button>
          <button
            v-else
            class="btn btn-primary text-sm"
            :disabled="!pickedVehicle || !comparator"
            :class="(!pickedVehicle || !comparator) ? '!opacity-40 !cursor-not-allowed' : ''"
            @click="applyAndClose"
          >
            Lancer la comparaison →
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
