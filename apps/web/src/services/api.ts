export type FuelPricesResponse = {
  source: string
  updated: string
  prices: {
    gasoline: { min: number, max: number, average: number }
    diesel: { min: number, max: number, average: number }
    e85: { min: number, max: number, average: number }
    lpg: { min: number, max: number, average: number }
  }
}

export type ElectricityTariffsResponse = {
  source: string
  updated: string
  tariffs: {
    regulated: { name: string, pricePerKwh: number }
    regulatedOffPeak: { name: string, fullPricePerKwh: number, offPeakPricePerKwh: number }
    tempo: { name: string, bluePricePerKwh: number, whitePricePerKwh: number, redPricePerKwh: number }
    publicCharging: { slowAC: number, fastDC50: number, ultraFastDC150: number, ionity: number }
  }
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok)
    throw new Error(`Request to ${url} failed: ${res.status}`)
  return (await res.json()) as T
}

export const api = {
  fuelPrices: () => fetchJSON<FuelPricesResponse>('/api/fuel-prices'),
  electricityTariffs: () => fetchJSON<ElectricityTariffsResponse>('/api/electricity-tariffs'),
}
