<script setup lang="ts">
import { ref } from 'vue'
import { useShareState } from '~/composables/useShareState'
import { useSimulationStore } from '~/stores/simulation'

const store = useSimulationStore()
const share = useShareState()
const copied = ref(false)

async function onShare() {
  const ok = await share.copyShareLink()
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 glass border-b border-line pt-safe">
    <div class="mx-auto max-w-[1400px] flex items-center justify-between px-4 sm:px-6 py-3.5">
      <div class="flex items-center gap-3">
        <div
          class="h-9 w-9 rounded-xl flex items-center justify-center text-[15px] font-bold text-[#04150d] glow-soft"
          style="background: var(--gradient-accent);"
        >
          €
        </div>
        <div>
          <div class="font-semibold text-[15px] leading-tight tracking-tight">
            Car TCO Simulator
          </div>
          <div class="hidden sm:block text-[12px] text-ink-subtle leading-tight">
            Quel coût réel pour ta voiture ?
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="store.pricesSource === 'live'"
          class="badge badge-accent inline-flex"
          title="Prix carburants moyens France en temps réel via data.gouv.fr"
        >
          <span class="dot-pulse h-1.5 w-1.5 rounded-full bg-accent text-accent" />
          <span class="sm:hidden">Live</span>
          <span class="hidden sm:inline">Prix carburants live</span>
        </span>
        <span
          v-else-if="store.pricesSource === 'static-fallback'"
          class="badge inline-flex"
          title="Live fetch indisponible — utilisation d'un snapshot récent. Tu peux ajuster manuellement les prix dans le profil."
        >
          <span class="h-1.5 w-1.5 rounded-full bg-warn" />
          <span class="sm:hidden">2026</span>
          <span class="hidden sm:inline">Prix snapshot 2026</span>
        </span>
        <span v-else class="badge hidden sm:inline-flex">
          <span class="h-1.5 w-1.5 rounded-full bg-ink-subtle" /> Chargement…
        </span>
        <button class="btn btn-ghost text-sm py-1.5 min-h-11" @click="onShare">
          {{ copied ? '✓ Lien copié' : 'Partager' }}
        </button>
      </div>
    </div>
  </header>
</template>
