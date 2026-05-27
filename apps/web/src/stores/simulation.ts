import type { DriverProfile, PurchaseCondition, TCOInput, TCOResult, Vehicle } from '@cts/shared'
import {
  compareTCO,
  computeTCO,
  DEFAULT_PROFILE,
  estimateUsedPrice,
  findPresetById,
  VEHICLE_PRESETS,
} from '@cts/shared'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '~/services/api'

const fallbackA = findPresetById('clio-essence') ?? VEHICLE_PRESETS[0]!
const fallbackB = findPresetById('e208-electric') ?? VEHICLE_PRESETS[1]!

function cloneVehicle(v: Vehicle): Vehicle {
  return { ...v }
}

function cloneProfile(p: DriverProfile): DriverProfile {
  return {
    ...p,
    tripMix: { ...p.tripMix },
    homeChargingMix: { ...p.homeChargingMix },
  }
}

export const useSimulationStore = defineStore('simulation', () => {
  const vehicleA = ref<Vehicle>(cloneVehicle(fallbackA))
  const vehicleB = ref<Vehicle>(cloneVehicle(fallbackB))
  const conditionA = ref<PurchaseCondition>('new')
  const conditionB = ref<PurchaseCondition>('new')
  const profile = ref<DriverProfile>(cloneProfile(DEFAULT_PROFILE))
  const durationYears = ref(5)
  const inflationPercent = ref(2.0)
  const energyInflationPercent = ref(3.0)
  const includeCarbonExternality = ref(false)
  const carbonPricePerTon = ref(90)
  const financingEnabled = ref(false)
  const financingDownPayment = ref(0)
  const financingApr = ref(4.5)
  const financingTermYears = ref(5)

  const livePricesLoaded = ref(false)
  const pricesSource = ref<'unknown' | 'live' | 'static-fallback'>('unknown')
  const pricesUpdatedAt = ref<string | null>(null)

  function applyConditionDefaults(vehicle: Vehicle, preset: Vehicle, condition: PurchaseCondition): Vehicle {
    const isUsed = condition !== 'new'
    return {
      ...vehicle,
      purchasePrice: estimateUsedPrice(preset, condition),
      bonus: isUsed ? 0 : preset.bonus,
      malus: isUsed ? 0 : preset.malus,
    }
  }

  function selectPresetA(id: string) {
    const v = findPresetById(id)
    if (v) vehicleA.value = applyConditionDefaults(cloneVehicle(v), v, conditionA.value)
  }
  function selectPresetB(id: string) {
    const v = findPresetById(id)
    if (v) vehicleB.value = applyConditionDefaults(cloneVehicle(v), v, conditionB.value)
  }

  function setConditionA(c: PurchaseCondition) {
    conditionA.value = c
    const preset = findPresetById(vehicleA.value.id)
    if (preset) vehicleA.value = applyConditionDefaults(vehicleA.value, preset, c)
  }
  function setConditionB(c: PurchaseCondition) {
    conditionB.value = c
    const preset = findPresetById(vehicleB.value.id)
    if (preset) vehicleB.value = applyConditionDefaults(vehicleB.value, preset, c)
  }

  function buildInput(vehicle: Vehicle, condition: PurchaseCondition): TCOInput {
    return {
      vehicle,
      profile: profile.value,
      durationYears: durationYears.value,
      purchaseCondition: condition,
      financing: {
        enabled: financingEnabled.value,
        downPayment: financingDownPayment.value,
        aprPercent: financingApr.value,
        termYears: financingTermYears.value,
      },
      includeCarbonExternality: includeCarbonExternality.value,
      carbonPricePerTon: carbonPricePerTon.value,
      inflationPercent: inflationPercent.value,
      energyInflationPercent: energyInflationPercent.value,
    }
  }

  const resultA = computed<TCOResult>(() => computeTCO(buildInput(vehicleA.value, conditionA.value)))
  const resultB = computed<TCOResult>(() => computeTCO(buildInput(vehicleB.value, conditionB.value)))
  const comparison = computed(() => compareTCO(resultA.value, resultB.value))

  async function loadLivePrices() {
    try {
      const [fuel, elec] = await Promise.all([api.fuelPrices(), api.electricityTariffs()])
      profile.value.gasolinePricePerLiter = fuel.prices.gasoline.average
      profile.value.dieselPricePerLiter = fuel.prices.diesel.average
      profile.value.electricityHomePricePerKwh = elec.tariffs.regulated.pricePerKwh
      profile.value.electricityFastPricePerKwh = elec.tariffs.publicCharging.fastDC50
      livePricesLoaded.value = true
      pricesSource.value = fuel.source === 'live' ? 'live' : 'static-fallback'
      pricesUpdatedAt.value = fuel.updated
    }
    catch (err) {
      console.warn('[simulation] live price load failed, using defaults', err)
    }
  }

  watch(
    () => profile.value.hasHomeCharging,
    (has) => {
      if (!has)
        profile.value.homeChargingMix = { home: 0, fastStation: 1 }
      else if (profile.value.homeChargingMix.home === 0)
        profile.value.homeChargingMix = { home: 0.85, fastStation: 0.15 }
    },
  )

  return {
    vehicleA,
    vehicleB,
    conditionA,
    conditionB,
    profile,
    durationYears,
    inflationPercent,
    energyInflationPercent,
    includeCarbonExternality,
    carbonPricePerTon,
    financingEnabled,
    financingDownPayment,
    financingApr,
    financingTermYears,
    livePricesLoaded,
    pricesSource,
    pricesUpdatedAt,
    resultA,
    resultB,
    comparison,
    selectPresetA,
    selectPresetB,
    setConditionA,
    setConditionB,
    loadLivePrices,
  }
})
