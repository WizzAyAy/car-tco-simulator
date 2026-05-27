import { memoizeWithTTL } from '../cache/lru'
import fallback from '../data/electricity-fallback.json' with { type: 'json' }

export type ElectricityTariffs = typeof fallback

export const electricityTariffsProvider = memoizeWithTTL<ElectricityTariffs>(
  'electricity:tariffs',
  async () => fallback,
  1000 * 60 * 60 * 24,
)
