<script setup lang="ts">
import type { SensitivityFactor, SensitivityRow, TCOInput } from '@cts/shared'
import type { EChartsOption } from 'echarts'
import { computeSensitivity } from '@cts/shared'
import { BarChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { ACCENT_GLOW, AXIS_LABEL, AXIS_LINE, BASE_CHART_OPTIONS, SERIES_COLORS, SPLIT_LINE } from '~/composables/useChartTheme'
import { formatEuro } from '~/composables/useFormatters'
import { useSimulationStore } from '~/stores/simulation'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, MarkLineComponent])

const store = useSimulationStore()

const DELTA_PERCENT = 15

const FACTOR_LABELS: Record<SensitivityFactor, string> = {
  annualKm: 'Kilométrage annuel',
  energyPrice: 'Prix de l\'énergie',
  depreciation: 'Dépréciation (prix d\'achat)',
  duration: 'Durée de détention',
  apr: 'Taux du crédit (TAEG)',
}

function buildInput(which: 'a' | 'b'): TCOInput {
  const vehicle = which === 'a' ? store.vehicleA : store.vehicleB
  const condition = which === 'a' ? store.conditionA : store.conditionB
  return {
    vehicle,
    profile: store.profile,
    durationYears: store.durationYears,
    purchaseCondition: condition,
    financing: {
      enabled: store.financingEnabled,
      downPayment: store.financingDownPayment,
      aprPercent: store.financingApr,
      termYears: store.financingTermYears,
    },
    includeCarbonExternality: store.includeCarbonExternality,
    carbonPricePerTon: store.carbonPricePerTon,
    inflationPercent: store.inflationPercent,
    energyInflationPercent: store.energyInflationPercent,
  }
}

const rows = computed<SensitivityRow[]>(() =>
  computeSensitivity(buildInput('a'), buildInput('b'), { deltaPercent: DELTA_PERCENT }),
)

const baseline = computed(() => rows.value[0]?.baseline ?? 0)

const option = computed<EChartsOption>(() => {
  // Bottom-to-top: ECharts category axis stacks the first item at the bottom,
  // so reverse to keep the widest swing on top.
  const ordered = [...rows.value].reverse()
  const labels = ordered.map(r => FACTOR_LABELS[r.factor])
  const base = baseline.value

  const lows = ordered.map(r => Math.min(r.lowSavings, r.highSavings))
  const spans = ordered.map(r => Math.abs(r.highSavings - r.lowSavings))

  return {
    ...BASE_CHART_OPTIONS,
    grid: { left: 184, right: 28, top: 16, bottom: 40 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        ...AXIS_LABEL,
        formatter: (v: number) => `${(v / 1000).toFixed(0)}k €`,
      },
      splitLine: SPLIT_LINE,
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: AXIS_LINE,
      axisLabel: { ...AXIS_LABEL, color: '#c2c9d6' },
    },
    tooltip: {
      ...BASE_CHART_OPTIONS.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const arr = params as Array<{ dataIndex: number }>
        const idx = arr[0]?.dataIndex ?? 0
        const row = ordered[idx]
        if (!row)
          return ''
        const label = FACTOR_LABELS[row.factor]
        return [
          `<strong>${label}</strong> (±${DELTA_PERCENT} %)`,
          `−${DELTA_PERCENT} % : ${formatEuro(row.lowSavings)}`,
          `+${DELTA_PERCENT} % : ${formatEuro(row.highSavings)}`,
        ].join('<br>')
      },
    },
    series: [
      {
        type: 'bar',
        stack: 'tornado',
        silent: true,
        itemStyle: { color: 'transparent' },
        data: lows,
      },
      {
        type: 'bar',
        stack: 'tornado',
        data: spans,
        barWidth: '60%',
        itemStyle: { color: SERIES_COLORS.B, borderRadius: 3, ...ACCENT_GLOW },
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
          label: {
            formatter: 'Verdict actuel',
            color: '#a8b0bf',
            fontSize: 11,
            position: 'insideEndTop',
          },
          data: [{ xAxis: base }],
        },
      },
    ],
  }
})
</script>

<template>
  <div class="card card-pad">
    <h3 class="text-base font-semibold mb-1">
      Sensibilité de l'économie
    </h3>
    <p class="text-xs text-ink-subtle mb-4">
      Impact d'une variation de ±{{ DELTA_PERCENT }} % de chaque hypothèse sur l'économie finale.
      Plus la barre est longue, plus l'hypothèse est déterminante.
    </p>
    <VChart :option="option" autoresize style="height: 280px;" />
  </div>
</template>
