<script setup lang="ts">
import type { Energy, Vehicle } from '@cts/shared'
import { computed } from 'vue'

const props = defineProps<{ vehicle: Vehicle }>()

/** Side-profile proportions per segment (viewBox 220×120). */
const CFG: Record<Vehicle['category'], { l: number, rearGap: number, cabin: number, hoodRun: number, roofH: number, wheelR: number }> = {
  cityCar: { l: 150, rearGap: 0.06, cabin: 0.34, hoodRun: 0.15, roofH: 42, wheelR: 16 },
  compact: { l: 172, rearGap: 0.07, cabin: 0.36, hoodRun: 0.16, roofH: 40, wheelR: 16 },
  sedan: { l: 198, rearGap: 0.20, cabin: 0.30, hoodRun: 0.16, roofH: 36, wheelR: 16 },
  estate: { l: 200, rearGap: 0.04, cabin: 0.50, hoodRun: 0.14, roofH: 40, wheelR: 16 },
  suv: { l: 182, rearGap: 0.05, cabin: 0.42, hoodRun: 0.13, roofH: 50, wheelR: 20 },
  utility: { l: 198, rearGap: 0.03, cabin: 0.62, hoodRun: 0.10, roofH: 56, wheelR: 17 },
}

const ENERGY_COLOR: Record<Energy, string> = {
  electric: '#34e89e',
  phev: '#22d3ee',
  hybrid: '#5eead4',
  gasoline: '#aeb6c5',
  diesel: '#9aa3b2',
}

const ENERGY_ICON: Record<Energy, string> = {
  electric: '⚡',
  phev: '🔌',
  hybrid: '🍃',
  gasoline: '⛽',
  diesel: '⛽',
}

const color = computed(() => ENERGY_COLOR[props.vehicle.energy])
const icon = computed(() => ENERGY_ICON[props.vehicle.energy])

const geom = computed(() => {
  const c = CFG[props.vehicle.category]
  const W = 220
  const L = c.l
  const x0 = (W - L) / 2
  const x1 = x0 + L
  const bodyBottom = 84
  const belt = 56
  const roofY = belt - c.roofH

  const roofRearX = x0 + L * c.rearGap
  const roofFrontX = roofRearX + L * c.cabin
  const windBaseX = Math.min(roofFrontX + L * c.hoodRun, x1 - 6)

  const body = [
    `M ${x0} ${bodyBottom}`,
    `L ${x1} ${bodyBottom}`,
    `L ${x1} ${belt}`,
    `L ${windBaseX} ${belt}`,
    `L ${roofFrontX} ${roofY}`,
    `L ${roofRearX} ${roofY}`,
    `L ${x0} ${belt}`,
    `Z`,
  ].join(' ')

  // Greenhouse (glass) — inset slightly from the cabin outline.
  const gy = roofY + 5
  const glass = [
    `M ${roofRearX + 6} ${belt - 4}`,
    `L ${roofFrontX - 4} ${gy}`,
    `L ${windBaseX - 6} ${gy}`,
    `L ${windBaseX + 4} ${belt - 4}`,
    `Z`,
  ].join(' ')

  const rearWX = x0 + L * 0.23
  const frontWX = x1 - L * 0.20

  return {
    body,
    glass,
    wheels: [
      { cx: rearWX, cy: bodyBottom, r: c.wheelR },
      { cx: frontWX, cy: bodyBottom, r: c.wheelR },
    ],
    shadow: { cx: (x0 + x1) / 2, rx: L / 2 + 6 },
  }
})

const gradId = computed(() => `veh-grad-${props.vehicle.energy}`)
</script>

<template>
  <svg
    viewBox="0 0 220 120"
    class="w-full h-full"
    role="img"
    :aria-label="`Silhouette ${vehicle.label}`"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.08" />
      </linearGradient>
    </defs>

    <!-- ground glow -->
    <ellipse
      :cx="geom.shadow.cx"
      cy="106"
      :rx="geom.shadow.rx"
      ry="7"
      :fill="color"
      opacity="0.18"
      style="filter: blur(4px);"
    />

    <g :style="`filter: drop-shadow(0 0 10px ${color}55);`">
      <path :d="geom.body" :fill="`url(#${gradId})`" :stroke="color" stroke-width="2.5" stroke-linejoin="round" />
      <path :d="geom.glass" :fill="color" opacity="0.22" />
      <circle
        v-for="(w, i) in geom.wheels"
        :key="i"
        :cx="w.cx"
        :cy="w.cy"
        :r="w.r"
        fill="#0a0c10"
        :stroke="color"
        stroke-width="2.5"
      />
      <circle
        v-for="(w, i) in geom.wheels"
        :key="`hub-${i}`"
        :cx="w.cx"
        :cy="w.cy"
        :r="w.r * 0.4"
        :fill="color"
        opacity="0.6"
      />
    </g>

    <text x="14" y="22" font-size="16">{{ icon }}</text>
  </svg>
</template>
