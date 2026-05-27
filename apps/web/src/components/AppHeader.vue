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
  <header class="border-b border-line bg-canvas-elevated">
    <div class="mx-auto max-w-[1400px] flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-lg bg-ink flex items-center justify-center text-canvas-elevated text-base font-bold">
          €
        </div>
        <div>
          <div class="font-semibold text-[15px] leading-tight">
            Car TCO Simulator
          </div>
          <div class="text-[12px] text-ink-subtle leading-tight">
            Quel coût réel pour ta voiture ?
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="store.pricesSource === 'live'"
          class="badge badge-accent"
          title="Prix carburants moyens France en temps réel via data.gouv.fr"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-accent" /> Prix carburants live
        </span>
        <span
          v-else-if="store.pricesSource === 'static-fallback'"
          class="badge"
          title="Live fetch indisponible — utilisation d'un snapshot récent. Tu peux ajuster manuellement les prix dans le profil."
        >
          <span class="h-1.5 w-1.5 rounded-full bg-warn" /> Prix snapshot 2026
        </span>
        <span v-else class="badge">
          <span class="h-1.5 w-1.5 rounded-full bg-ink-subtle" /> Chargement…
        </span>
        <button class="btn btn-ghost text-sm py-1.5" @click="onShare">
          {{ copied ? '✓ Lien copié' : 'Partager' }}
        </button>
      </div>
    </div>
  </header>
</template>
