import { describe, expect, it } from 'vitest'
import { ALL_VEHICLES } from '../src/vehicles/index'

describe('vehicle image coverage', () => {
  it('every vehicle (preset + archetype) has a photo and attribution', () => {
    expect(ALL_VEHICLES.filter(v => !v.imageUrl).map(v => v.id)).toEqual([])
    expect(ALL_VEHICLES.filter(v => !v.imageCredit).map(v => v.id)).toEqual([])
  })
})
