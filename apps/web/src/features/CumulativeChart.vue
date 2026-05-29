<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { ACCENT_GLOW, AXIS_LABEL, AXIS_LINE, BASE_CHART_OPTIONS, LEGEND_TEXT, SERIES_COLORS, SPLIT_LINE } from '~/composables/useChartTheme'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const store = useSimulationStore()

const option = computed<EChartsOption>(() => {
  const years = store.resultA.byYear.map((y: { year: number }) => `An ${y.year}`)
  const dataA = store.resultA.byYear.map((y: { cumulative: number }) => Math.round(y.cumulative))
  const dataB = store.resultB.byYear.map((y: { cumulative: number }) => Math.round(y.cumulative))

  return {
    ...BASE_CHART_OPTIONS,
    legend: { data: [store.vehicleA.label, store.vehicleB.label], top: 0, textStyle: LEGEND_TEXT, icon: 'roundRect' },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: AXIS_LINE,
      axisLabel: AXIS_LABEL,
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
      valueFormatter: (v: unknown) => `${Math.round(v as number).toLocaleString('fr-FR')} €`,
    },
    series: [
      {
        name: store.vehicleA.label,
        type: 'line',
        data: dataA,
        smooth: true,
        lineStyle: { width: 2.5, color: SERIES_COLORS.A },
        itemStyle: { color: SERIES_COLORS.A },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: store.vehicleB.label,
        type: 'line',
        data: dataB,
        smooth: true,
        lineStyle: { width: 3, color: SERIES_COLORS.B, ...ACCENT_GLOW },
        itemStyle: { color: SERIES_COLORS.B },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52, 232, 158, 0.28)' },
              { offset: 1, color: 'rgba(52, 232, 158, 0)' },
            ],
          },
        },
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
