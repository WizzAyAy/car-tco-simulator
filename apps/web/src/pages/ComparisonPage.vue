<script setup lang="ts">
import type { Vehicle } from '@cts/shared'
import { computed, ref } from 'vue'
import AnimatedNumber from '~/components/AnimatedNumber.vue'
import AppHeader from '~/components/AppHeader.vue'
import { formatEuro, formatYears } from '~/composables/useFormatters'
import { useLiveVerdict } from '~/composables/useOgImage'
import { usePageMeta, useSocialImage } from '~/composables/usePageMeta'
import { useShareState } from '~/composables/useShareState'
import BreakdownChart from '~/features/BreakdownChart.vue'
import BreakEvenCard from '~/features/BreakEvenCard.vue'
import CumulativeChart from '~/features/CumulativeChart.vue'
import ComparisonDeck from '~/features/deck/ComparisonDeck.vue'
import SettingsDrawer from '~/features/deck/SettingsDrawer.vue'
import ListingLinksDropdown from '~/features/ListingLinksDropdown.vue'
import TornadoChart from '~/features/TornadoChart.vue'
import VehicleCard from '~/features/VehicleCard.vue'
import VehiclePreview from '~/features/VehiclePreview.vue'
import VerdictHero from '~/features/VerdictHero.vue'
import WizardModal from '~/features/WizardModal.vue'
import YearlyTable from '~/features/YearlyTable.vue'
import { useSimulationStore } from '~/stores/simulation'

const props = withDefaults(defineProps<{
  /**
   * When `true` (default, e.g. the `/` route), this page owns the full social
   * metadata derived from the live verdict. SEO wrappers like `CompareSeoPage`
   * pass `false` to keep ownership of the slug-tuned title/description, while
   * this page still drives the reactive `og:image` as the single source of truth.
   */
  managedMeta?: boolean
}>(), {
  managedMeta: true,
})

const store = useSimulationStore()
const share = useShareState()
const wizardOpen = ref(false)
const drawerOpen = ref(false)
const copied = ref(false)
const deckCurrent = ref(0)

const verdict = useLiveVerdict()
const ogImage = computed(() => verdict.value.ogImageUrl)

const verdictTitle = computed(() => `${verdict.value.headline} · Car TCO Simulator`)
const verdictDescription = computed(() =>
  `${verdict.value.headline} — ${verdict.value.sub}. Coût total d'usage tout inclus : `
  + `carburant ou électricité, entretien, assurance, dépréciation, malus et financement.`,
)

useSocialImage(ogImage)

if (props.managedMeta)
  usePageMeta(verdictTitle, verdictDescription)

const SLIDES = [
  { key: 'verdict', eyebrow: 'Comparatif', title: 'Le verdict' },
  { key: 'duel', eyebrow: 'Les concurrentes', title: 'Le duel' },
  { key: 'time', eyebrow: 'Dans le temps', title: 'Coût cumulé' },
  { key: 'breakdown', eyebrow: 'Où part l\'argent', title: 'Postes de coût' },
  { key: 'sensitivity', eyebrow: 'Et si…', title: 'Sensibilité' },
  { key: 'yearly', eyebrow: 'Le détail', title: 'Année par année' },
  { key: 'recap', eyebrow: 'Synthèse', title: 'Récap & partage' },
] as const

const winnerLabel = computed(() => {
  const w = store.comparison.winner
  if (w === 'tie')
    return 'Match nul'
  return w === 'a' ? store.vehicleA.label : store.vehicleB.label
})
const savingsAbs = computed(() => Math.round(store.comparison.savings))
const monthlyEq = computed(() => store.comparison.savings / (store.durationYears * 12))
const breakEvenLabel = computed(() =>
  store.comparison.breakEvenYear === null
    ? null
    : `Équilibre après ${formatYears(store.comparison.breakEvenYear)}`,
)

function updateVehicleA(v: Vehicle) {
  store.vehicleA = v
}
function updateVehicleB(v: Vehicle) {
  store.vehicleB = v
}

async function onShare() {
  const ok = await share.copyShareLink()
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>

<template>
  <div class="h-[100dvh] flex flex-col bg-canvas overflow-hidden">
    <AppHeader />

    <main class="flex-1 min-h-0">
      <ComparisonDeck v-model:current="deckCurrent" :slides="[...SLIDES]" :nav-locked="wizardOpen || drawerOpen">
        <!-- 1 · Verdict -->
        <template #verdict>
          <div class="h-full flex flex-col justify-center gap-6 max-w-4xl mx-auto w-full">
            <VerdictHero />
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="grid grid-cols-2 gap-3 flex-1 min-w-[18rem]">
                <button
                  v-for="(car, side) in { A: store.vehicleA, B: store.vehicleB }"
                  :key="side"
                  type="button"
                  class="card card-pad !p-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-line-strong hover:-translate-y-0.5"
                  @click="deckCurrent = 1"
                >
                  <div class="h-14 w-24 shrink-0">
                    <VehiclePreview :vehicle="car" credit="icon" class="h-full" />
                  </div>
                  <div class="min-w-0">
                    <div class="text-ink-subtle text-[11px]">
                      Voiture {{ side }}
                    </div>
                    <div class="font-medium text-sm leading-tight truncate">
                      {{ car.label }}
                    </div>
                    <div class="font-num text-ink-muted text-xs">
                      {{ formatEuro(side === 'A' ? store.resultA.totalCost : store.resultB.totalCost) }}
                    </div>
                  </div>
                </button>
              </div>
              <button type="button" class="btn btn-primary shrink-0" @click="wizardOpen = true">
                ✨ Aide-moi à choisir en 2 minutes
              </button>
            </div>
          </div>
        </template>

        <!-- 2 · Duel -->
        <template #duel>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full content-start lg:content-stretch">
            <VehicleCard
              side="A"
              :vehicle="store.vehicleA"
              :condition="store.conditionA"
              :total-cost="store.resultA.totalCost"
              :per-month="store.resultA.monthlyEquivalent"
              :per-km="store.resultA.perKilometer"
              accent-class=""
              @update:vehicle="updateVehicleA"
              @select-preset="store.selectPresetA"
              @set-condition="store.setConditionA"
            />
            <VehicleCard
              side="B"
              :vehicle="store.vehicleB"
              :condition="store.conditionB"
              :total-cost="store.resultB.totalCost"
              :per-month="store.resultB.monthlyEquivalent"
              :per-km="store.resultB.perKilometer"
              accent-class="badge-accent"
              @update:vehicle="updateVehicleB"
              @select-preset="store.selectPresetB"
              @set-condition="store.setConditionB"
            />
          </div>
        </template>

        <!-- 3 · Coût cumulé -->
        <template #time>
          <div class="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5 h-full">
            <CumulativeChart fill />
            <BreakEvenCard class="h-full" />
          </div>
        </template>

        <!-- 4 · Postes de coût -->
        <template #breakdown>
          <BreakdownChart fill class="h-full" />
        </template>

        <!-- 5 · Sensibilité -->
        <template #sensitivity>
          <TornadoChart fill class="h-full" />
        </template>

        <!-- 6 · Année par année -->
        <template #yearly>
          <YearlyTable />
        </template>

        <!-- 7 · Récap & partage -->
        <template #recap>
          <div class="h-full flex flex-col justify-center gap-6 max-w-4xl mx-auto w-full">
            <div class="card card-glow card-pad">
              <div class="eyebrow mb-2">
                Sur {{ formatYears(store.durationYears) }}, le moins cher est
              </div>
              <div class="text-3xl sm:text-4xl font-bold tracking-tight text-gradient inline-block">
                {{ winnerLabel }}
              </div>
              <p v-if="store.comparison.winner !== 'tie'" class="text-ink-muted mt-2">
                soit
                <AnimatedNumber
                  :value="savingsAbs"
                  class="font-num font-semibold text-accent"
                  :format="(v) => formatEuro(v)"
                />
                d'économie ·
                <span class="font-num">{{ formatEuro(monthlyEq) }}/mois</span>
              </p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="card card-pad text-center">
                <div class="eyebrow mb-1">
                  Total A
                </div>
                <div class="font-num font-semibold text-lg">
                  {{ formatEuro(store.resultA.totalCost) }}
                </div>
              </div>
              <div class="card card-pad text-center">
                <div class="eyebrow mb-1">
                  Total B
                </div>
                <div class="font-num font-semibold text-lg">
                  {{ formatEuro(store.resultB.totalCost) }}
                </div>
              </div>
              <div class="card card-pad text-center">
                <div class="eyebrow mb-1">
                  Économie
                </div>
                <div class="font-num font-semibold text-lg text-accent">
                  {{ formatEuro(savingsAbs) }}
                </div>
              </div>
              <div class="card card-pad text-center">
                <div class="eyebrow mb-1">
                  Bascule
                </div>
                <div class="font-num font-semibold text-lg">
                  {{ breakEvenLabel ? breakEvenLabel.replace('Équilibre après ', '') : '—' }}
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button type="button" class="btn btn-primary" @click="onShare">
                {{ copied ? '✓ Lien copié' : 'Partager ce comparatif' }}
              </button>
              <button type="button" class="btn btn-ghost" @click="drawerOpen = true">
                ⚙︎ Ajuster les hypothèses
              </button>
            </div>

            <div
              v-if="!store.vehicleA.isArchetype || !store.vehicleB.isArchetype"
              class="card card-pad flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <span class="eyebrow">
                Où acheter ?
              </span>
              <div v-if="!store.vehicleA.isArchetype" class="flex items-center gap-2 min-w-0">
                <span class="text-sm text-ink-muted truncate max-w-[12rem]">{{ store.vehicleA.label }}</span>
                <ListingLinksDropdown :vehicle="store.vehicleA" :condition="store.conditionA" />
              </div>
              <div v-if="!store.vehicleB.isArchetype" class="flex items-center gap-2 min-w-0">
                <span class="text-sm text-ink-muted truncate max-w-[12rem]">{{ store.vehicleB.label }}</span>
                <ListingLinksDropdown :vehicle="store.vehicleB" :condition="store.conditionB" />
              </div>
            </div>

            <p class="text-xs text-ink-subtle leading-relaxed max-w-2xl">
              Estimation tous postes inclus (carburant/électricité, entretien, assurance, dépréciation,
              malus, financement). Dépréciation via courbes par catégorie et énergie, prix carburants
              temps réel data.gouv.fr, entretien barème ADEME. Pour des chiffres précis, consulte un
              concessionnaire et ton assureur. · open data : data.gouv.fr · ADEME
            </p>
          </div>
        </template>

        <!-- Persistent settings access -->
        <template #nav-actions>
          <button
            type="button"
            class="btn btn-ghost text-sm py-1.5 gap-1.5"
            aria-label="Ouvrir les réglages"
            @click="drawerOpen = true"
          >
            <span class="text-base leading-none">⚙︎</span>
            <span class="hidden sm:inline">Réglages</span>
          </button>
        </template>
      </ComparisonDeck>
    </main>

    <WizardModal :open="wizardOpen" @applied="deckCurrent = 1" @close="wizardOpen = false" />
    <SettingsDrawer :open="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>
