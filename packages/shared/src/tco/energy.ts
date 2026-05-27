import type { DriverProfile, Vehicle } from '../types'

const FRENCH_GRID_CO2_G_PER_KWH = 56

export interface EnergyYear {
  cost: number
  co2Kg: number
}

export function energyCostPerYear(
  vehicle: Vehicle,
  profile: DriverProfile,
  energyInflationFactor: number,
): EnergyYear {
  const km = profile.annualKm
  const consoPer100 = vehicle.consumption

  if (vehicle.energy === 'electric') {
    const kwh = (consoPer100 * km) / 100
    const blendedPrice
      = profile.homeChargingMix.home * profile.electricityHomePricePerKwh
        + profile.homeChargingMix.fastStation * profile.electricityFastPricePerKwh
    const cost = kwh * blendedPrice * energyInflationFactor
    const co2Kg = (kwh * FRENCH_GRID_CO2_G_PER_KWH) / 1000
    return { cost, co2Kg }
  }

  if (vehicle.energy === 'phev') {
    const electricShare = 0.55
    const electricKwh = ((consoPer100 * 0.35) * km * electricShare) / 100
    const litres = ((consoPer100 * 0.65) * km * (1 - electricShare)) / 100
    const elecBlend
      = profile.homeChargingMix.home * profile.electricityHomePricePerKwh
        + profile.homeChargingMix.fastStation * profile.electricityFastPricePerKwh
    const cost = (electricKwh * elecBlend + litres * profile.gasolinePricePerLiter) * energyInflationFactor
    const co2Kg = (km * vehicle.co2) / 1000
    return { cost, co2Kg }
  }

  const litres = (consoPer100 * km) / 100
  const pricePerLiter
    = vehicle.energy === 'diesel' ? profile.dieselPricePerLiter : profile.gasolinePricePerLiter
  const cost = litres * pricePerLiter * energyInflationFactor
  const co2Kg = (km * vehicle.co2) / 1000
  return { cost, co2Kg }
}
