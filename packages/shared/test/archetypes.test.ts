import { describe, expect, it } from 'vitest'
import { buildArchetypes, VEHICLE_ARCHETYPES, VEHICLE_PRESETS } from '../src/vehicles'

describe('vehicle archetypes', () => {
  it('derives at least the common segments', () => {
    expect(VEHICLE_ARCHETYPES.length).toBeGreaterThan(5)
    // city EV and SUV EV are well-populated buckets
    expect(VEHICLE_ARCHETYPES.some(a => a.id === 'archetype-citycar-electric')).toBe(true)
    expect(VEHICLE_ARCHETYPES.some(a => a.id === 'archetype-suv-electric')).toBe(true)
  })

  it('flags every archetype and never collides with a real preset id', () => {
    const realIds = new Set(VEHICLE_PRESETS.map(v => v.id))
    for (const a of VEHICLE_ARCHETYPES) {
      expect(a.isArchetype).toBe(true)
      expect(realIds.has(a.id)).toBe(false)
    }
  })

  it('prices each archetype within the real bucket range', () => {
    for (const a of VEHICLE_ARCHETYPES) {
      const bucket = VEHICLE_PRESETS.filter(v => v.category === a.category && v.energy === a.energy)
      const prices = bucket.map(v => v.purchasePrice)
      expect(a.purchasePrice).toBeGreaterThanOrEqual(Math.min(...prices))
      expect(a.purchasePrice).toBeLessThanOrEqual(Math.max(...prices))
    }
  })

  it('keeps electric archetypes emission-free and ranged', () => {
    for (const a of VEHICLE_ARCHETYPES.filter(v => v.energy === 'electric')) {
      expect(a.co2).toBe(0)
      expect(a.wltpRangeKm).toBeGreaterThan(0)
    }
  })

  it('is pure — same catalog yields identical archetypes', () => {
    expect(buildArchetypes(VEHICLE_PRESETS)).toEqual(buildArchetypes(VEHICLE_PRESETS))
  })

  it('reflects mainstream prices, not premium-inflated medians', () => {
    const compactGas = VEHICLE_ARCHETYPES.find(a => a.id === 'archetype-compact-gasoline')
    const compactEv = VEHICLE_ARCHETYPES.find(a => a.id === 'archetype-compact-electric')
    expect(compactGas).toBeDefined()
    expect(compactEv).toBeDefined()
    // A mainstream compact gasoline must stay clearly cheaper than the EV archetype,
    // and below the premium-inflated all-bucket median (~35.7k).
    expect(compactGas!.purchasePrice).toBeLessThan(33000)
    expect(compactGas!.purchasePrice).toBeLessThan(compactEv!.purchasePrice)
  })

  it('skips sparse buckets (fewer than 3 real models)', () => {
    for (const a of VEHICLE_ARCHETYPES) {
      const count = VEHICLE_PRESETS.filter(v => v.category === a.category && v.energy === a.energy).length
      expect(count).toBeGreaterThanOrEqual(3)
    }
  })
})
