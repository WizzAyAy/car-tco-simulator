<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { AXIS_LABEL, AXIS_LINE, BASE_CHART_OPTIONS, BREAKDOWN_GROUPS, CATEGORY_LABELS, LEGEND_TEXT, SPLIT_LINE } from '~/composables/useChartTheme'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

defineProps<{ fill?: boolean }>()

const store = useSimulationStore()

const euro = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} €`

const option = computed<EChartsOption>(() => {
  const groupTotal = (result: typeof store.resultA, group: typeof BREAKDOWN_GROUPS[number]) =>
    group.categories.reduce((sum, cat) => sum + result.byCategory[cat], 0)

  const visibleGroups = BREAKDOWN_GROUPS.filter((group) => {
    const a = groupTotal(store.resultA, group)
    const b = groupTotal(store.resultB, group)
    return Math.abs(a) > 5 || Math.abs(b) > 5
  })

  const series = visibleGroups.map(group => ({
    name: group.label,
    type: 'bar' as const,
    stack: 'total',
    data: [
      Math.round(groupTotal(store.resultA, group)),
      Math.round(groupTotal(store.resultB, group)),
    ],
    itemStyle: { color: group.color },
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
      formatter: (params: unknown) => {
        const rows = Array.isArray(params) ? params : [params]
        if (!rows.length)
          return ''
        const vIdx = (rows[0] as { dataIndex: number }).dataIndex
        const result = vIdx === 0 ? store.resultA : store.resultB
        const label = vIdx === 0 ? store.vehicleA.label : store.vehicleB.label
        const lines = visibleGroups.map((group) => {
          const total = groupTotal(result, group)
          const subs = group.categories
            .filter(cat => Math.abs(result.byCategory[cat]) > 5)
            .map(cat => `<div style="display:flex;justify-content:space-between;gap:16px;color:#a8b0bf;font-size:11px;padding-left:16px"><span>${CATEGORY_LABELS[cat]}</span><span>${euro(result.byCategory[cat])}</span></div>`)
            .join('')
          const head = `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${group.color}"></span>${group.label}</span><span style="font-weight:600">${euro(total)}</span></div>`
          return group.categories.length > 1 ? head + subs : head
        }).join('')
        return `<div style="font-weight:600;margin-bottom:2px">${label}</div>${lines}`
      },
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
      Quatre grands postes sur toute la durée. Survole une barre pour le détail poste par poste.
    </p>
    <VChart class="w-full" :option="option" autoresize :style="fill ? 'flex:1 1 0;min-height:0' : 'height:360px'" />
  </div>
</template>
