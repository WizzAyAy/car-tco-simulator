<script setup lang="ts">
import type { Vehicle } from '@cts/shared'
import { computed, ref } from 'vue'
import AppHeader from '~/components/AppHeader.vue'
import { useLiveVerdict } from '~/composables/useOgImage'
import { usePageMeta, useSocialImage } from '~/composables/usePageMeta'
import BreakdownChart from '~/features/BreakdownChart.vue'
import BreakEvenCard from '~/features/BreakEvenCard.vue'
import CumulativeChart from '~/features/CumulativeChart.vue'
import ProfilePanel from '~/features/ProfilePanel.vue'
import SettingsPanel from '~/features/SettingsPanel.vue'
import TornadoChart from '~/features/TornadoChart.vue'
import VehicleCard from '~/features/VehicleCard.vue'
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
const wizardOpen = ref(false)

const verdict = useLiveVerdict()
const ogImage = computed(() => verdict.value.ogImageUrl)

const verdictTitle = computed(() => `${verdict.value.headline} · Car TCO Simulator`)
const verdictDescription = computed(() =>
  `${verdict.value.headline} — ${verdict.value.sub}. Coût total d'usage tout inclus : `
  + `carburant ou électricité, entretien, assurance, dépréciation, malus et financement.`,
)

// og:image is always driven from the live store (single source of truth),
// even when an SEO wrapper owns the title/description.
useSocialImage(ogImage)

if (props.managedMeta)
  usePageMeta(verdictTitle, verdictDescription)

function updateVehicleA(v: Vehicle) {
  store.vehicleA = v
}
function updateVehicleB(v: Vehicle) {
  store.vehicleB = v
}
</script>

<template>
  <div class="min-h-full flex flex-col bg-canvas">
    <AppHeader />

    <main class="mx-auto max-w-[1400px] w-full px-6 py-10 sm:py-14 flex-1 space-y-12 sm:space-y-16">
      <!-- Intro / framing -->
      <section class="max-w-3xl">
        <div class="eyebrow mb-4">
          Coût total d'usage · TCO
        </div>
        <h1 class="text-4xl sm:text-6xl font-extrabold leading-[1.02] tracking-tight mb-4">
          Compare le <span class="text-gradient">coût réel</span><br>de 2 voitures, sans surprise.
        </h1>
        <p class="text-ink-muted text-base sm:text-lg mb-6 max-w-2xl">
          Carburant ou électricité, entretien, assurance, dépréciation, malus, financement…
          tout est inclus. Ajuste les sliders pour explorer les scénarios.
        </p>
        <button
          type="button"
          class="btn btn-primary"
          @click="wizardOpen = true"
        >
          ✨ Aide-moi à choisir en 6 questions
        </button>
      </section>

      <!-- Verdict -->
      <section v-reveal>
        <VerdictHero />
      </section>

      <!-- Vehicle cards side-by-side -->
      <section v-reveal class="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
      </section>

      <!-- Charts -->
      <section v-reveal class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CumulativeChart />
        <BreakdownChart />
      </section>

      <!-- Sensitivity analyses -->
      <section v-reveal class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BreakEvenCard />
        <TornadoChart />
      </section>

      <!-- Configuration sidebar / panels -->
      <section v-reveal class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProfilePanel />
        <SettingsPanel />
      </section>

      <!-- Yearly table -->
      <section v-reveal>
        <YearlyTable />
      </section>

      <!-- Methodology -->
      <section v-reveal class="card card-pad text-sm text-ink-muted">
        <h3 class="font-semibold text-ink mb-2">
          Méthodologie en 1 minute
        </h3>
        <ul class="list-disc list-inside space-y-1">
          <li>
            <span class="font-medium text-ink">Dépréciation</span> : valeur résiduelle estimée
            via courbes par catégorie et énergie (référence marché France 2024-2026).
          </li>
          <li>
            <span class="font-medium text-ink">Carburant / électricité</span> : prix temps réel
            depuis data.gouv.fr (mise à jour heure-par-heure) — ajustables manuellement.
          </li>
          <li>
            <span class="font-medium text-ink">Entretien</span> : barème ADEME modulé par âge
            (les voitures vieillissent plus cher).
          </li>
          <li>
            <span class="font-medium text-ink">Assurance</span> : base par formule × catégorie ×
            bonus-malus × coefficient âge.
          </li>
          <li>
            <span class="font-medium text-ink">Inflation</span> : appliquée séparément sur les
            postes énergétiques (souvent plus volatile).
          </li>
        </ul>
        <p class="mt-3 text-xs">
          Cette simulation est une estimation. Pour des chiffres précis,
          consulte un concessionnaire et ton assureur.
        </p>
      </section>
    </main>

    <footer class="border-t border-line py-4 text-center text-xs text-ink-subtle">
      Car TCO Simulator · open data : data.gouv.fr · ADEME
    </footer>

    <WizardModal :open="wizardOpen" @close="wizardOpen = false" />
  </div>
</template>
