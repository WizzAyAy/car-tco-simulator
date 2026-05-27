<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
  step?: number
  label?: string
  hint?: string
  unit?: string
  display?: (v: number) => string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const pct = computed(() => {
  const range = props.max - props.min
  if (range === 0) return 0
  return ((props.modelValue - props.min) / range) * 100
})

const displayValue = computed(() => {
  if (props.display) return props.display(props.modelValue)
  return `${props.modelValue}${props.unit ?? ''}`
})

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', value)
}
</script>

<template>
  <div>
    <div v-if="label || hint" class="label">
      <span>{{ label }}</span>
      <span v-if="hint" class="text-ink-subtle text-xs">{{ hint }}</span>
    </div>
    <div class="flex items-center gap-3">
      <input
        type="range"
        class="slider flex-1"
        :min="min"
        :max="max"
        :step="step ?? 1"
        :value="modelValue"
        :style="{ '--pct': `${pct}%` } as Record<string, string>"
        @input="onInput"
      />
      <span class="font-num text-sm font-medium tabular-nums min-w-[80px] text-right">
        {{ displayValue }}
      </span>
    </div>
  </div>
</template>
