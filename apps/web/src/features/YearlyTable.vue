<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatEuro } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()
const showAll = ref(false)

const rows = computed(() => {
  const a = store.resultA.byYear
  const b = store.resultB.byYear
  return a.map((yearA: { year: number, total: number, cumulative: number }, i: number) => ({
    year: yearA.year,
    a: Math.round(yearA.total),
    aCum: Math.round(yearA.cumulative),
    b: Math.round(b[i]?.total ?? 0),
    bCum: Math.round(b[i]?.cumulative ?? 0),
    diff: Math.round((b[i]?.cumulative ?? 0) - yearA.cumulative),
  }))
})

const visible = computed(() => (showAll.value ? rows.value : rows.value.slice(0, 8)))
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-1">Détail année par année</h3>
    <p class="text-xs text-ink-subtle mb-4">
      Le delta cumulé négatif signifie que la voiture B coûte moins cher à ce moment-là.
    </p>

    <div class="overflow-x-auto">
      <table class="w-full text-sm font-num tabular-nums">
        <thead class="border-b border-line">
          <tr class="text-xs text-ink-subtle uppercase tracking-wide">
            <th class="text-left py-2 pr-3 font-medium">Année</th>
            <th class="text-right py-2 px-3 font-medium">A · cette année</th>
            <th class="text-right py-2 px-3 font-medium">A · cumulé</th>
            <th class="text-right py-2 px-3 font-medium">B · cette année</th>
            <th class="text-right py-2 px-3 font-medium">B · cumulé</th>
            <th class="text-right py-2 pl-3 font-medium">Δ cumulé (B−A)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visible"
            :key="row.year"
            class="border-b border-line/60 hover:bg-canvas transition-colors"
          >
            <td class="py-2.5 pr-3 font-sans">An {{ row.year }}</td>
            <td class="text-right py-2.5 px-3">{{ formatEuro(row.a) }}</td>
            <td class="text-right py-2.5 px-3 text-ink-muted">{{ formatEuro(row.aCum) }}</td>
            <td class="text-right py-2.5 px-3">{{ formatEuro(row.b) }}</td>
            <td class="text-right py-2.5 px-3 text-ink-muted">{{ formatEuro(row.bCum) }}</td>
            <td
              class="text-right py-2.5 pl-3 font-medium"
              :class="row.diff < 0 ? 'text-accent' : row.diff > 0 ? 'text-warn' : 'text-ink-subtle'"
            >
              {{ row.diff > 0 ? '+' : '' }}{{ formatEuro(row.diff) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      v-if="rows.length > 8"
      class="btn btn-ghost text-xs mt-4 w-full"
      @click="showAll = !showAll"
    >
      {{ showAll ? `Réduire (${rows.length - 8} de moins)` : `Afficher les ${rows.length - 8} autres années` }}
    </button>
  </div>
</template>
