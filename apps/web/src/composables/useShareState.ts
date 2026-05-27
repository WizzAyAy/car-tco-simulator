import type { PurchaseCondition } from '@cts/shared'
import { watch } from 'vue'
import { useSimulationStore } from '~/stores/simulation'

interface ShareableState {
  a: string
  b: string
  ca?: PurchaseCondition
  cb?: PurchaseCondition
  km: number
  years: number
  charge?: number
}

const QUERY_KEY = 's'

function encode(state: ShareableState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))))
}

function decode(blob: string): ShareableState | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(blob)))) as ShareableState
  }
  catch {
    return null
  }
}

export function useShareState() {
  const store = useSimulationStore()

  function snapshot(): ShareableState {
    return {
      a: store.vehicleA.id,
      b: store.vehicleB.id,
      ca: store.conditionA,
      cb: store.conditionB,
      km: store.profile.annualKm,
      years: store.durationYears,
      charge: store.profile.hasHomeCharging ? store.profile.homeChargingMix.home : -1,
    }
  }

  function applyFromQuery() {
    const url = new URL(window.location.href)
    const param = url.searchParams.get(QUERY_KEY)
    if (!param)
      return
    const state = decode(param)
    if (!state)
      return

    if (state.ca)
      store.setConditionA(state.ca)
    if (state.cb)
      store.setConditionB(state.cb)
    store.selectPresetA(state.a)
    store.selectPresetB(state.b)
    if (Number.isFinite(state.km))
      store.profile.annualKm = state.km
    if (Number.isFinite(state.years))
      store.durationYears = state.years
    if (typeof state.charge === 'number' && state.charge >= 0) {
      store.profile.hasHomeCharging = true
      store.profile.homeChargingMix = { home: state.charge, fastStation: 1 - state.charge }
    }
  }

  function syncToUrl() {
    const param = encode(snapshot())
    const url = new URL(window.location.href)
    url.searchParams.set(QUERY_KEY, param)
    window.history.replaceState({}, '', url.toString())
  }

  async function copyShareLink(): Promise<boolean> {
    syncToUrl()
    try {
      await navigator.clipboard.writeText(window.location.href)
      return true
    }
    catch {
      return false
    }
  }

  function watchStore() {
    watch(
      [
        () => store.vehicleA.id,
        () => store.vehicleB.id,
        () => store.conditionA,
        () => store.conditionB,
        () => store.profile.annualKm,
        () => store.durationYears,
        () => store.profile.homeChargingMix.home,
        () => store.profile.hasHomeCharging,
      ],
      () => syncToUrl(),
      { deep: false },
    )
  }

  return { applyFromQuery, syncToUrl, copyShareLink, watchStore }
}
