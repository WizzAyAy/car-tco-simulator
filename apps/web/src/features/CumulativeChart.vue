<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { BASE_CHART_OPTIONS, SERIES_COLORS } from '~/composables/useChartTheme'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const store = useSimulationStore()

const option = computed<EChartsOption>(() => {
  const years = store.resultA.byYear.map((y: { year: number }) => `An ${y.year}`)
  const dataA = store.resultA.byYear.map((y: { cumulative: number }) => Math.round(y.cumulative))
  const dataB = store.resultB.byYear.map((y: { cumulative: number }) => Math.round(y.cumulative))

  return {
    ...BASE_CHART_OPTIONS,
    legend: { data: [store.vehicleA.label, store.vehicleB.label], top: 0, textStyle: { color: '#44403c' } },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: '#d6d3d1' } },
      axisLabel: { color: '#78716c', fontSize: 12 },
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
      valueFormatter: (v: unknown) => `${Math.round(v as number).toLocaleString('fr-FR')} €`,
    },
    series: [
      {
        name: store.vehicleA.label,
        type: 'line',
        data: dataA,
        smooth: true,
        lineStyle: { width: 3, color: SERIES_COLORS.A },
        itemStyle: { color: SERIES_COLORS.A },
        symbol: 'circle',
        symbolSize: 7,
      },
      {
        name: store.vehicleB.label,
        type: 'line',
        data: dataB,
        smooth: true,
        lineStyle: { width: 3, color: SERIES_COLORS.B },
        itemStyle: { color: SERIES_COLORS.B },
        symbol: 'circle',
        symbolSize: 7,
      },
    ],
  }
})
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-1">
      Coût cumulé année par année
    </h3>
    <p class="text-xs text-ink-subtle mb-4">
      Plus la courbe monte vite, plus la voiture coûte cher. L'intersection éventuelle marque le point d'équilibre.
    </p>
    <VChart :option="option" autoresize style="height: 320px;" />
  </div>
</template>
