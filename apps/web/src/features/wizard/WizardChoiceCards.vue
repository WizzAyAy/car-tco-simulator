<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

interface Choice {
  value: T
  label: string
  hint?: string
  icon: string
}

const props = withDefaults(defineProps<{
  modelValue: T
  options: Choice[]
  columns?: number
}>(), {
  columns: 2,
})

defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

// Mobile-first: fewer columns on small screens, full count from `sm`.
// Full class strings only — interpolated names would be purged by the JIT.
const gridClass = computed(() =>
  props.columns >= 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
)
</script>

<template>
  <div class="grid gap-2.5" :class="gridClass">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="group relative text-left rounded-xl border p-3.5 transition-all duration-200 will-change-transform"
      :class="modelValue === opt.value
        ? 'border-accent/60 bg-accent-soft shadow-[0_0_28px_-8px_rgba(52,232,158,0.6)] -translate-y-0.5'
        : 'border-line bg-canvas-inset hover:border-line-strong hover:-translate-y-0.5'"
      @click="$emit('update:modelValue', opt.value)"
    >
      <!-- check badge -->
      <span
        class="absolute top-2.5 right-2.5 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-[#04150d] transition-all duration-200"
        :class="modelValue === opt.value ? 'bg-accent scale-100 opacity-100' : 'scale-50 opacity-0'"
        style="box-shadow: 0 0 14px -2px rgba(52, 232, 158, 0.8);"
      >✓</span>

      <span
        class="block text-2xl leading-none mb-2 transition-transform duration-200 origin-left"
        :class="modelValue === opt.value ? 'scale-110' : 'group-hover:scale-105'"
      >{{ opt.icon }}</span>
      <span
        class="block text-sm font-semibold leading-tight transition-colors"
        :class="modelValue === opt.value ? 'text-accent' : 'text-ink'"
      >{{ opt.label }}</span>
      <span v-if="opt.hint" class="block text-xs text-ink-subtle mt-0.5 leading-snug">
        {{ opt.hint }}
      </span>
    </button>
  </div>
</template>
