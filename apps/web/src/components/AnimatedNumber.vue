<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    format?: (v: number) => string
  }>(),
  { duration: 500 },
)

const displayed = ref(props.value)
let raf: number | null = null

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function animateTo(target: number) {
  if (raf)
    cancelAnimationFrame(raf)
  const start = displayed.value
  const startTime = performance.now()
  const delta = target - start
  const tick = (now: number) => {
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / props.duration)
    displayed.value = start + delta * easeOutCubic(t)
    if (t < 1)
      raf = requestAnimationFrame(tick)
    else displayed.value = target
  }
  raf = requestAnimationFrame(tick)
}

watch(() => props.value, target => animateTo(target))
onMounted(() => {
  displayed.value = props.value
})
</script>

<template>
  <span class="font-num tabular-nums">
    {{ format ? format(displayed) : Math.round(displayed) }}
  </span>
</template>
