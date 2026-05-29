<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import ProfilePanel from '~/features/ProfilePanel.vue'
import SettingsPanel from '~/features/SettingsPanel.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

onKeyStroke('Escape', () => {
  if (props.open)
    emit('close')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="drawer-slide">
      <aside
        v-if="open"
        class="fixed top-0 right-0 z-50 h-full w-full max-w-md glass border-l border-line shadow-[var(--shadow-lift)] flex flex-col"
        role="dialog"
        aria-label="Réglages de la simulation"
      >
        <header class="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <div class="eyebrow mb-0.5">
              Réglages
            </div>
            <h2 class="text-base font-semibold tracking-tight">
              Profil &amp; paramètres
            </h2>
          </div>
          <button
            type="button"
            class="text-ink-subtle hover:text-ink text-xl leading-none"
            aria-label="Fermer les réglages"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <p class="text-xs text-ink-subtle leading-relaxed">
            Ajuste librement — tout se recalcule en direct sur la slide affichée.
          </p>
          <ProfilePanel />
          <SettingsPanel />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 240ms var(--ease-out-expo);
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 320ms var(--ease-out-expo);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-slide-enter-active,
  .drawer-slide-leave-active {
    transition: none;
  }
  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    transform: none;
  }
}
</style>
