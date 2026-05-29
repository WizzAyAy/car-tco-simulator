<script setup lang="ts">
import { onKeyStroke, useSwipe } from '@vueuse/core'
import { computed, ref } from 'vue'

interface SlideMeta {
  key: string
  eyebrow?: string
  title: string
}

const props = withDefaults(defineProps<{
  slides: SlideMeta[]
  /** When true, keyboard/swipe navigation is suspended (e.g. a modal/drawer is open). */
  navLocked?: boolean
}>(), {
  navLocked: false,
})

const current = defineModel<number>('current', { default: 0 })
const count = computed(() => props.slides.length)

function go(i: number) {
  current.value = Math.min(count.value - 1, Math.max(0, i))
}
function next() {
  go(current.value + 1)
}
function prev() {
  go(current.value - 1)
}

function isTyping() {
  const el = document.activeElement
  return !!el && /^(?:INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
}

const viewport = ref<HTMLElement | null>(null)
const { lengthX, isSwiping } = useSwipe(viewport, {
  threshold: 24,
  onSwipeEnd() {
    if (props.navLocked)
      return
    if (lengthX.value > 60)
      next()
    else if (lengthX.value < -60)
      prev()
  },
})

onKeyStroke('ArrowRight', (e) => {
  if (props.navLocked || isTyping())
    return
  e.preventDefault()
  next()
})
onKeyStroke('ArrowLeft', (e) => {
  if (props.navLocked || isTyping())
    return
  e.preventDefault()
  prev()
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div ref="viewport" class="relative flex-1 min-h-0 overflow-hidden touch-pan-y">
      <div
        class="deck-track flex h-full"
        :class="{ 'is-dragging': isSwiping }"
        :style="{ transform: `translateX(-${current * 100}%)` }"
      >
        <section
          v-for="(s, i) in slides"
          :key="s.key"
          class="shrink-0 w-full h-full flex flex-col px-5 sm:px-10 pt-5 pb-3 overflow-y-auto"
          :aria-hidden="i !== current"
          :inert="i !== current ? true : undefined"
        >
          <div class="mb-3 shrink-0">
            <div v-if="s.eyebrow" class="eyebrow mb-1">
              {{ s.eyebrow }}
            </div>
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
              {{ s.title }}
            </h2>
          </div>
          <div class="flex-1 min-h-0">
            <slot :name="s.key" />
          </div>
        </section>
      </div>

      <!-- Floating side arrows (desktop) -->
      <button
        type="button"
        class="hidden md:grid place-items-center absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full glass text-xl text-ink transition-all duration-200 hover:border-accent/50 disabled:opacity-0 disabled:pointer-events-none"
        :disabled="current === 0"
        aria-label="Slide précédente"
        @click="prev"
      >‹</button>
      <button
        type="button"
        class="hidden md:grid place-items-center absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full glass text-xl text-ink transition-all duration-200 hover:border-accent/50 disabled:opacity-0 disabled:pointer-events-none"
        :disabled="current === count - 1"
        aria-label="Slide suivante"
        @click="next"
      >›</button>
    </div>

    <!-- Bottom nav -->
    <nav class="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-8 py-3 border-t border-line glass">
      <button
        type="button"
        class="btn btn-ghost text-sm py-1.5 md:hidden"
        :disabled="current === 0"
        :class="{ '!opacity-30': current === 0 }"
        @click="prev"
      >←</button>

      <div class="flex items-center gap-3 mx-auto md:mx-0">
        <div class="flex items-center gap-1.5">
          <button
            v-for="(s, i) in slides"
            :key="s.key"
            type="button"
            class="h-2 rounded-full transition-all duration-300"
            :class="i === current
              ? 'w-6 bg-accent shadow-[0_0_12px_-1px_rgba(52,232,158,0.8)]'
              : 'w-2 bg-white/20 hover:bg-white/40'"
            :aria-label="`Aller à : ${s.title}`"
            :aria-current="i === current ? 'true' : undefined"
            @click="go(i)"
          />
        </div>
        <span class="text-xs text-ink-subtle font-num tabular-nums">{{ current + 1 }} / {{ count }}</span>
      </div>

      <div class="flex items-center gap-2">
        <slot name="nav-actions" />
        <button
          type="button"
          class="btn btn-ghost text-sm py-1.5 md:hidden"
          :disabled="current === count - 1"
          :class="{ '!opacity-30': current === count - 1 }"
          @click="next"
        >→</button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.deck-track {
  transition: transform 480ms var(--ease-out-expo);
  will-change: transform;
}
.deck-track.is-dragging {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .deck-track {
    transition: none;
  }
}
</style>
