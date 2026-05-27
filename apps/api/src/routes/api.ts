import { VEHICLE_PRESETS } from '@cts/shared/vehicles'
import { Hono } from 'hono'
import { electricityTariffsProvider } from '../providers/electricity'
import { fuelPricesProvider } from '../providers/fuel-prices'
import { og } from './og'

export const api = new Hono()

api.route('/og', og)

api.get('/health', c => c.json({ ok: true, ts: Date.now() }))

api.get('/fuel-prices', async (c) => {
  const data = await fuelPricesProvider.get()
  return c.json(data, 200, { 'cache-control': 'public, max-age=900' })
})

api.get('/electricity-tariffs', async (c) => {
  const data = await electricityTariffsProvider.get()
  return c.json(data, 200, { 'cache-control': 'public, max-age=3600' })
})

api.get('/vehicle-presets', (c) => {
  return c.json({ vehicles: VEHICLE_PRESETS }, 200, { 'cache-control': 'public, max-age=86400' })
})
