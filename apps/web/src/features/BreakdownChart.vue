<script setup lang="ts">
import type { CostCategory } from '@cts/shared'
import type { EChartsOption } from 'echarts'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { AXIS_LABEL, AXIS_LINE, BASE_CHART_OPTIONS, CATEGORY_COLORS, CATEGORY_LABELS, LEGEND_TEXT, SPLIT_LINE } from '~/composables/useChartTheme'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

defineProps<{ fill?: boolean }>()

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
    itemStyle: { color: CATEGORY_COLORS[cat] },
    emphasis: { focus: 'series' as const },
  }))

  return {
    ...BASE_CHART_OPTIONS,
    legend: {
      bottom: 0,
      type: 'scroll',
      textStyle: { ...LEGEND_TEXT, fontSize: 11 },
      pageTextStyle: LEGEND_TEXT,
      pageIconColor: '#a8b0bf',
      pageIconInactiveColor: '#4b5563',
    },
    grid: { ...BASE_CHART_OPTIONS.grid, bottom: 70 },
    xAxis: {
      type: 'category',
      data: [store.vehicleA.label, store.vehicleB.label],
      axisLine: AXIS_LINE,
      axisLabel: {
        ...AXIS_LABEL,
        interval: 0,
        rotate: 0,
        formatter: (v: string) => (v.length > 22 ? `${v.slice(0, 22)}…` : v),
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        ...AXIS_LABEL,
        formatter: (v: number) => `${(v / 1000).toFixed(0)}k €`,
      },
      splitLine: SPLIT_LINE,
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
  <div class="card card-pad" :class="{ 'h-full flex flex-col': fill }">
    <h3 class="text-base font-semibold mb-1">
      Décomposition par poste de coût
    </h3>
    <p class="text-xs text-ink-subtle mb-4">
      Chaque couleur représente un type de dépense sur toute la durée. Survole les barres pour les détails.
    </p>
    <VChart class="w-full" :option="option" autoresize :style="fill ? 'flex:1 1 0;min-height:0' : 'height:360px'" />
  </div>
</template>
