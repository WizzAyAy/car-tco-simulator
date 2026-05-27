import fallback from '../data/fuel-prices-fallback.json' with { type: 'json' }
import { memoizeWithTTL } from '../cache/lru'

const DATA_GOUV_ENDPOINT
  = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records'

type FuelType = 'gasoline' | 'diesel' | 'e85' | 'lpg'

export type FuelPrices = {
  source: 'live' | 'static-fallback'
  updated: string
  prices: Record<FuelType, { min: number, max: number, average: number }>
}

const FUEL_CODE_MAP: Record<FuelType, string[]> = {
  gasoline: ['SP95', 'SP95-E10', 'SP98'],
  diesel: ['Gazole'],
  e85: ['E85'],
  lpg: ['GPLc'],
}

async function fetchFromDataGouv(): Promise<FuelPrices> {
  const allFuel = [...FUEL_CODE_MAP.gasoline, ...FUEL_CODE_MAP.diesel, ...FUEL_CODE_MAP.e85, ...FUEL_CODE_MAP.lpg]
  const where = allFuel.map(f => `prix_nom = "${f}"`).join(' OR ')
  const url = `${DATA_GOUV_ENDPOINT}?where=${encodeURIComponent(where)}&limit=100&select=prix_nom,prix_valeur`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok)
    throw new Error(`data.gouv.fr returned ${response.status}`)

  const data = (await response.json()) as { results: Array<{ prix_nom: string, prix_valeur: number }> }
  const buckets: Record<FuelType, number[]> = {
    gasoline: [],
    diesel: [],
    e85: [],
    lpg: [],
  }

  for (const record of data.results) {
    for (const [fuelType, codes] of Object.entries(FUEL_CODE_MAP) as Array<[FuelType, string[]]>) {
      if (codes.includes(record.prix_nom) && Number.isFinite(record.prix_valeur)) {
        buckets[fuelType].push(record.prix_valeur)
      }
    }
  }

  const prices = {} as FuelPrices['prices']
  for (const fuelType of Object.keys(buckets) as FuelType[]) {
    const values = buckets[fuelType]
    if (values.length === 0) {
      prices[fuelType] = fallback.prices[fuelType]
      continue
    }
    const sorted = [...values].sort((a, b) => a - b)
    const min = sorted[0]!
    const max = sorted[sorted.length - 1]!
    const average = sorted.reduce((s, v) => s + v, 0) / sorted.length
    prices[fuelType] = {
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      average: Number(average.toFixed(3)),
    }
  }

  return {
    source: 'live',
    updated: new Date().toISOString(),
    prices,
  }
}

export const fuelPricesProvider = memoizeWithTTL<FuelPrices>(
  'fuel-prices:national',
  async () => {
    try {
      return await fetchFromDataGouv()
    }
    catch (err) {
      console.warn('[fuel-prices] live fetch failed, using fallback:', (err as Error).message)
      return fallback as FuelPrices
    }
  },
  1000 * 60 * 60,
)
