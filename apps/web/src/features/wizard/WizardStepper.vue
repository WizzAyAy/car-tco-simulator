<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '~/components/AnimatedNumber.vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min: number
  max: number
  step?: number
  unit?: string
}>(), {
  step: 1,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const canDec = computed(() => props.modelValue > props.min)
const canInc = computed(() => props.modelValue < props.max)

function bump(dir: 1 | -1) {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + dir * props.step))
  if (next !== props.modelValue)
    emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex items-center justify-center gap-5 py-2">
    <button
      type="button"
      class="grid h-12 w-12 place-items-center rounded-full text-2xl leading-none transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      :class="canDec ? 'btn-ghost hover:border-accent/50 active:scale-90' : 'btn-ghost'"
      :disabled="!canDec"
      aria-label="Diminuer"
      @click="bump(-1)"
    >−</button>

    <div class="text-center min-w-[7rem]">
      <div class="flex items-baseline justify-center gap-1.5">
        <AnimatedNumber
          :value="modelValue"
          :duration="280"
          class="text-gradient font-num font-extrabold text-5xl leading-none"
          style="filter: drop-shadow(0 0 18px rgba(52, 232, 158, 0.4));"
        />
        <span v-if="unit" class="text-base font-semibold text-ink-muted">{{ unit }}</span>
      </div>
    </div>

    <button
      type="button"
      class="grid h-12 w-12 place-items-center rounded-full text-2xl leading-none transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      :class="canInc ? 'btn-ghost hover:border-accent/50 active:scale-90' : 'btn-ghost'"
      :disabled="!canInc"
      aria-label="Augmenter"
      @click="bump(1)"
    >+</button>
  </div>
</template>
