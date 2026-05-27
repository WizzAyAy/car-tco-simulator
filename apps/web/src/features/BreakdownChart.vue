<script setup lang="ts">
import type { CostCategory } from '@cts/shared'
import type { EChartsOption } from 'echarts'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { BASE_CHART_OPTIONS, CATEGORY_COLORS, CATEGORY_LABELS } from '~/composables/useChartTheme'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const store = useSimulationStore()

const CATEGORIES_ORDER: CostCategory[] = [
  'depreciation',
  'energy',
  'insurance',
  'maintenance',
  'repairs',
  'tires',
  'leasing',
  'financing',
  'malus',
  'parking',
  'controlTechnique',
  'registration',
  'consumables',
  'carbon',
]

const option = computed<EChartsOption>(() => {
  const visibleCats = CATEGORIES_ORDER.filter((cat) => {
    const a = store.resultA.byCategory[cat]
    const b = store.resultB.byCategory[cat]
    return Math.abs(a) > 5 || Math.abs(b) > 5
  })

  const series = visibleCats.map(cat => ({
    name: CATEGORY_LABELS[cat],
    type: 'bar' as const,
    stack: 'total',
    data: [
      Math.round(store.resultA.byCategory[cat]),
      Math.round(store.resultB.byCategory[cat]),
    ],
    itemStyle: { color: CATEGORY_COLORS[cat], borderRadius: [0, 0, 0, 0] },
    emphasis: { focus: 'series' as const },
  }))

  return {
    ...BASE_CHART_OPTIONS,
    legend: {
      bottom: 0,
      type: 'scroll',
      textStyle: { color: '#44403c', fontSize: 11 },
    },
    grid: { ...BASE_CHART_OPTIONS.grid, bottom: 70 },
    xAxis: {
      type: 'category',
      data: [store.vehicleA.label, store.vehicleB.label],
      axisLine: { lineStyle: { color: '#d6d3d1' } },
      axisLabel: {
        color: '#78716c',
        fontSize: 12,
        interval: 0,
        rotate: 0,
        formatter: (v: string) => (v.length > 22 ? `${v.slice(0, 22)}…` : v),
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: '#78716c',
        fontSize: 12,
        formatter: (v: number) => `${(v / 1000).toFixed(0)}k €`,
      },
      splitLine: { lineStyle: { color: '#e7e5e4', type: 'dashed' } },
    },
    tooltip: {
      ...BASE_CHART_OPTIONS.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v: unknown) => `${Math.round(v as number).toLocaleString('fr-FR')} €`,
    },
    series,
  }
})
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-1">
      Décomposition par poste de coût
    </h3>
    <p class="text-xs text-ink-subtle mb-4">
      Chaque couleur représente un type de dépense sur toute la durée. Survole les barres pour les détails.
    </p>
    <VChart :option="option" autoresize style="height: 360px;" />
  </div>
</template>
