<script setup lang="ts">
import type { CargoNeeds, ChargingAccess, DominantTrip, EcoPriority, FamilySize, LifestyleProfile, LongTripFrequency, ParkingConstraint, PurchaseCondition, ScoredVehicle, Vehicle } from '@cts/shared'
import { DEFAULT_LIFESTYLE, estimateUsedPrice, findPresetById, findTraditionalComparator, rankVehicles, VEHICLE_PRESETS } from '@cts/shared'
import { computed, ref, watch } from 'vue'
import SliderInput from '~/components/SliderInput.vue'
import { formatEuro, formatKm } from '~/composables/useFormatters'
import WizardChoiceCards from '~/features/wizard/WizardChoiceCards.vue'
import WizardStepper from '~/features/wizard/WizardStepper.vue'
import { useSimulationStore } from '~/stores/simulation'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void, (e: 'applied'): void }>()

const store = useSimulationStore()
const step = ref(0)
const profile = ref<LifestyleProfile>({ ...DEFAULT_LIFESTYLE })
const pickedId = ref<string | null>(null)

const totalSteps = 10

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    step.value = 0
    pickedId.value = null
    profile.value = { ...DEFAULT_LIFESTYLE }
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
  store.durationYears = profile.value.keepYears
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
  emit('applied')
  emit('close')
}

const navDir = ref(1)
function next() {
  if (step.value < totalSteps) {
    navDir.value = 1
    step.value++
  }
}
function prev() {
  if (step.value > 0) {
    navDir.value = -1
    step.value--
  }
}

const kmDescriptor = computed(() => {
  const k = profile.value.annualKm
  if (k < 8000)
    return { label: 'Petit rouleur', icon: '🐢' }
  if (k < 16000)
    return { label: 'Usage modéré', icon: '🚗' }
  if (k < 25000)
    return { label: 'Gros rouleur', icon: '🏁' }
  return { label: 'Très gros rouleur', icon: '🚀' }
})

const stepTitles = [
  'Combien tu roules par an ?',
  'Quel type de trajets domine ?',
  'Tu pars loin souvent ?',
  'Tu transportes qui ?',
  'Tu transportes quoi ?',
  'Ton stationnement au quotidien ?',
  'Tu peux recharger chez toi ?',
  'Quel est ton budget d\'achat ?',
  'Tu comptes la garder combien de temps ?',
  'L\'écologie pèse combien ?',
]

const tripOptions: { value: DominantTrip, label: string, hint: string, icon: string }[] = [
  { value: 'urban', label: 'Urbain', hint: 'Ville, petits trajets, bouchons', icon: '🏙️' },
  { value: 'mixed', label: 'Mixte', hint: 'Ville + route, polyvalent', icon: '🛣️' },
  { value: 'highway', label: 'Autoroute', hint: 'Beaucoup de longs trajets rapides', icon: '🏎️' },
]

const longTripOptions: { value: LongTripFrequency, label: string, hint: string, icon: string }[] = [
  { value: 'rarely', label: 'Rarement', hint: 'Quasi jamais > 200 km', icon: '🏘️' },
  { value: 'sometimes', label: 'Parfois', hint: 'Quelques fois par an', icon: '🗺️' },
  { value: 'often', label: 'Souvent', hint: 'Longs trajets réguliers', icon: '🧳' },
]

const familyOptions: { value: FamilySize, label: string, hint: string, icon: string }[] = [
  { value: 'solo', label: 'Solo', hint: '1 personne', icon: '🧍' },
  { value: 'couple', label: 'Couple', hint: '2 adultes', icon: '👫' },
  { value: 'family', label: 'Famille', hint: '1-2 enfants', icon: '👨‍👩‍👧' },
  { value: 'largeFamily', label: 'Grande famille', hint: '3+ enfants ou gros coffre', icon: '👨‍👩‍👧‍👦' },
]

const cargoOptions: { value: CargoNeeds, label: string, hint: string, icon: string }[] = [
  { value: 'minimal', label: 'Le minimum', hint: 'Courses, un sac', icon: '🎒' },
  { value: 'occasional', label: 'Parfois du volume', hint: 'Valises, meubles à l\'occasion', icon: '📦' },
  { value: 'frequent', label: 'Souvent chargé', hint: 'Matériel, vélos, remorque', icon: '🚚' },
]

const parkingOptions: { value: ParkingConstraint, label: string, hint: string, icon: string }[] = [
  { value: 'tight', label: 'Serré', hint: 'Rue étroite, places difficiles', icon: '😬' },
  { value: 'normal', label: 'Normal', hint: 'Places standard sans souci', icon: '🅿️' },
  { value: 'easy', label: 'Large', hint: 'Garage ou parking spacieux', icon: '🏡' },
]

const chargingOptions: { value: ChargingAccess, label: string, hint: string, icon: string }[] = [
  { value: 'wallbox', label: 'Wallbox', hint: 'Borne dédiée à domicile', icon: '⚡' },
  { value: 'standardPlug', label: 'Prise standard', hint: 'Prise 230V au garage', icon: '🔌' },
  { value: 'none', label: 'Aucune', hint: 'Pas de recharge chez moi', icon: '🚫' },
]

const ecoOptions: { value: EcoPriority, label: string, hint: string, icon: string }[] = [
  { value: 'top', label: 'Priorité', hint: 'Minimiser mon empreinte', icon: '🌳' },
  { value: 'important', label: 'Importante', hint: 'Ça compte, sans bloquer', icon: '🌱' },
  { value: 'neutral', label: 'Neutre', hint: 'Pas un critère décisif', icon: '⚖️' },
]
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="card-pad border-b border-line flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">
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
        <div class="h-1 bg-white/8">
          <div
            class="h-full transition-all duration-300"
            style="background: var(--gradient-accent);"
            :style="{ width: `${(step / totalSteps) * 100}%` }"
          />
        </div>

        <div class="card-pad min-h-[280px]">
          <Transition :name="navDir === 1 ? 'slide-next' : 'slide-prev'" mode="out-in">
            <div :key="step">
              <h3 v-if="step < totalSteps" class="text-base font-semibold mb-2">
                {{ stepTitles[step] }}
              </h3>

              <!-- Step 0: km/year -->
              <div v-if="step === 0">
                <p class="text-sm text-ink-muted mb-5">
                  C'est le levier numéro 1 : à fort kilométrage, l'électrique et le diesel deviennent intéressants ;
                  à faible km, une essence neuve ou occasion bien choisie peut suffire.
                </p>
                <div class="flex items-center justify-center gap-2 mb-4">
                  <span class="text-2xl">{{ kmDescriptor.icon }}</span>
                  <span class="badge badge-accent text-sm">{{ kmDescriptor.label }}</span>
                </div>
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
                <p class="text-sm text-ink-muted mb-4">
                  L'urbain favorise hybride/EV, l'autoroute pénalise l'EV (surconsommation à 130 km/h).
                </p>
                <WizardChoiceCards
                  v-model="profile.dominantTrip"
                  :options="tripOptions"
                  :columns="3"
                />
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

              <!-- Step 2: long trips -->
              <div v-else-if="step === 2">
                <p class="text-sm text-ink-muted mb-4">
                  Les longs trajets fréquents pénalisent l'EV (arrêts de recharge) et avantagent thermique/hybride.
                </p>
                <WizardChoiceCards
                  v-model="profile.longTrips"
                  :options="longTripOptions"
                  :columns="3"
                />
              </div>

              <!-- Step 3: family -->
              <div v-else-if="step === 3">
                <p class="text-sm text-ink-muted mb-4">
                  Détermine le format minimum acceptable (citadine, compacte, break, SUV…).
                </p>
                <WizardChoiceCards
                  v-model="profile.family"
                  :options="familyOptions"
                  :columns="2"
                />
              </div>

              <!-- Step 4: cargo -->
              <div v-else-if="step === 4">
                <p class="text-sm text-ink-muted mb-4">
                  Un besoin de volume régulier oriente vers break, SUV ou utilitaire.
                </p>
                <WizardChoiceCards
                  v-model="profile.cargoNeeds"
                  :options="cargoOptions"
                  :columns="3"
                />
              </div>

              <!-- Step 5: parking -->
              <div v-else-if="step === 5">
                <p class="text-sm text-ink-muted mb-4">
                  Un stationnement serré pénalise les gros gabarits et avantage les citadines.
                </p>
                <WizardChoiceCards
                  v-model="profile.parkingConstraint"
                  :options="parkingOptions"
                  :columns="3"
                />
              </div>

              <!-- Step 6: charging -->
              <div v-else-if="step === 6">
                <p class="text-sm text-ink-muted mb-4">
                  Sans recharge maison, un EV devient nettement moins attractif (borne publique = +50 % à +100 %).
                </p>
                <WizardChoiceCards
                  v-model="profile.charging"
                  :options="chargingOptions"
                  :columns="3"
                />
              </div>

              <!-- Step 7: budget -->
              <div v-else-if="step === 7">
                <p class="text-sm text-ink-muted mb-5">
                  Montant maximum pour l'achat. On proposera des modèles qui tiennent ce budget en neuf,
                  et des modèles plus chers accessibles en occasion.
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

              <!-- Step 8: keep duration (stepper) -->
              <div v-else-if="step === 8">
                <p class="text-sm text-ink-muted mb-3">
                  Une détention longue amortit la décote initiale (utile pour l'électrique) ;
                  une revente rapide la pénalise.
                </p>
                <WizardStepper
                  v-model="profile.keepYears"
                  :min="1"
                  :max="15"
                  :step="1"
                  :unit="profile.keepYears > 1 ? 'ans' : 'an'"
                />
              </div>

              <!-- Step 9: eco priority -->
              <div v-else-if="step === 9">
                <p class="text-sm text-ink-muted mb-4">
                  Ça module le scoring entre énergies. Une EV n'est « verte » que si tu la gardes longtemps.
                </p>
                <WizardChoiceCards
                  v-model="profile.ecoPriority"
                  :options="ecoOptions"
                  :columns="3"
                />
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
                    class="w-full text-left p-3 rounded-md border transition-all duration-200"
                    :class="pickedId === r.vehicle.id
                      ? 'border-accent/60 bg-accent-soft shadow-[0_0_22px_-8px_rgba(52,232,158,0.6)]'
                      : 'border-line hover:border-line-strong bg-canvas-inset'"
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
                <div v-if="pickedVehicle && comparator && pickedCondition && comparatorCondition" class="mt-5 p-4 rounded-md border border-line bg-canvas-inset">
                  <div class="eyebrow mb-2">
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
                    </div>
                  </div>
                  <p class="text-[11px] text-ink-subtle mt-3 leading-relaxed">
                    On part en {{ conditionLabel(pickedCondition) }} / {{ conditionLabel(comparatorCondition) }}
                    pour coller à ton budget de {{ formatEuro(profile.budgetMaxEur) }}.
                    Tu pourras rebasculer en neuf depuis la page de comparaison.
                  </p>
                </div>
              </div>
            </div>
          </Transition>
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

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 220ms var(--ease-out-expo),
    transform 220ms var(--ease-out-expo);
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active {
    transition: none;
  }
  .slide-next-enter-from,
  .slide-next-leave-to,
  .slide-prev-enter-from,
  .slide-prev-leave-to {
    transform: none;
  }
}
</style>
