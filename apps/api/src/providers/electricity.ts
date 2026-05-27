import fallback from '../data/electricity-fallback.json' with { type: 'json' }
import { memoizeWithTTL } from '../cache/lru'

export type ElectricityTariffs = typeof fallback

export const electricityTariffsProvider = memoizeWithTTL<ElectricityTariffs>(
  'electricity:tariffs',
  async () => fallback,
  1000 * 60 * 60 * 24,
)
