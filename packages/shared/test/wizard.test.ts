import { describe, expect, it } from 'vitest'
import { findPresetById, VEHICLE_PRESETS } from '../src/vehicles'
import { DEFAULT_LIFESTYLE, findTraditionalComparator, rankVehicles, scoreVehicle } from '../src/wizard'

describe('lifestyle wizard scorer', () => {
  it('urban solo low-budget user gets a city car suggested first', () => {
    const ranked = rankVehicles(VEHICLE_PRESETS, {
      ...DEFAULT_LIFESTYLE,
      annualKm: 6000,
      dominantTrip: 'urban',
      commuteOneWayKm: 10,
      family: 'solo',
      charging: 'none',
      budgetMaxEur: 18000,
      ecoPriority: 'neutral',
    })
    expect(ranked.length).toBeGreaterThan(0)
    expect(ranked[0]!.vehicle.category).toBe('cityCar')
  })

  it('large family with home wallbox + 25k km/year + eco top prefers EV SUV/estate', () => {
    const ranked = rankVehicles(VEHICLE_PRESETS, {
      ...DEFAULT_LIFESTYLE,
      annualKm: 25000,
      dominantTrip: 'mixed',
      commuteOneWayKm: 35,
      family: 'largeFamily',
      charging: 'wallbox',
      budgetMaxEur: 55000,
      ecoPriority: 'top',
    })
    expect(ranked[0]!.vehicle.energy).toBe('electric')
    expect(['suv', 'estate', 'utility']).toContain(ranked[0]!.vehicle.category)
  })

  it('user with no home charging never gets a pure EV as top pick', () => {
    const ranked = rankVehicles(VEHICLE_PRESETS, {
      ...DEFAULT_LIFESTYLE,
      charging: 'none',
      budgetMaxEur: 40000,
    })
    expect(ranked[0]!.vehicle.energy).not.toBe('electric')
  })

  it('eV with insufficient range for very long daily commute gets a warning', () => {
    const spring = findPresetById('spring-electric')!
    // 150km one-way × 2 = 300km daily, Spring 220km WLTP × 0.78 = 171km — insufficient
    const score = scoreVehicle(spring, {
      ...DEFAULT_LIFESTYLE,
      commuteOneWayKm: 150,
      charging: 'wallbox',
    })
    expect(score.warnings.some(w => w.toLowerCase().includes('autonomie'))).toBe(true)
  })

  it('finds an essence comparator in same category for a picked EV', () => {
    const e208 = findPresetById('e208-electric')! // cityCar electric
    const comp = findTraditionalComparator(e208, VEHICLE_PRESETS)
    expect(comp).not.toBeNull()
    expect(comp!.category).toBe('cityCar')
    expect(['gasoline', 'diesel']).toContain(comp!.energy)
  })

  it('finds a diesel comparator when picked is essence', () => {
    const clio = findPresetById('clio-essence')! // cityCar gasoline
    const comp = findTraditionalComparator(clio, VEHICLE_PRESETS)
    expect(comp).not.toBeNull()
    expect(comp!.category).toBe('cityCar')
    expect(comp!.energy).toBe('diesel')
  })

  it('finds an essence comparator when picked is diesel', () => {
    const passat = findPresetById('passat-sw-diesel')! // estate diesel
    const comp = findTraditionalComparator(passat, VEHICLE_PRESETS)
    expect(comp).not.toBeNull()
    expect(comp!.energy).toBe('gasoline')
  })

  it('comparator is never the picked vehicle itself', () => {
    for (const v of VEHICLE_PRESETS) {
      const comp = findTraditionalComparator(v, VEHICLE_PRESETS)
      expect(comp?.id).not.toBe(v.id)
    }
  })

  it('long highway trips with EV gets penalised vs hybrid', () => {
    const profile = {
      ...DEFAULT_LIFESTYLE,
      annualKm: 30000,
      dominantTrip: 'highway' as const,
      commuteOneWayKm: 80,
      charging: 'standardPlug' as const,
      budgetMaxEur: 50000,
    }
    const evScore = scoreVehicle(findPresetById('e208-electric')!, profile)
    const hybridScore = scoreVehicle(findPresetById('yaris-hybrid')!, profile)
    expect(hybridScore.score).toBeGreaterThan(evScore.score)
  })
})
