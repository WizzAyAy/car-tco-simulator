import type { Vehicle } from '../types'

export type FamilySize = 'solo' | 'couple' | 'family' | 'largeFamily'
export type EcoPriority = 'top' | 'important' | 'neutral'
export type DominantTrip = 'urban' | 'mixed' | 'highway'
export type ChargingAccess = 'wallbox' | 'standardPlug' | 'none'
export type ParkingConstraint = 'tight' | 'normal' | 'easy'
export type CargoNeeds = 'minimal' | 'occasional' | 'frequent'
export type LongTripFrequency = 'rarely' | 'sometimes' | 'often'

export interface LifestyleProfile {
  annualKm: number
  dominantTrip: DominantTrip
  /** One-way distance home ↔ work in km — we multiply by 2 internally for daily commute */
  commuteOneWayKm: number
  family: FamilySize
  charging: ChargingAccess
  budgetMaxEur: number
  ecoPriority: EcoPriority
  /** How tight is everyday parking — penalises bulky cars when 'tight'. Neutral at 'normal'. */
  parkingConstraint: ParkingConstraint
  /** Boot / load needs — favours estates/SUVs/utilities when 'frequent'. Neutral at 'occasional'. */
  cargoNeeds: CargoNeeds
  /** Planned ownership horizon in years — long holds reward EV durability. Neutral around 5. */
  keepYears: number
  /** Frequency of long (>200 km) trips — penalises EV charging stops when 'often'. Neutral at 'sometimes'. */
  longTrips: LongTripFrequency
}

export interface ScoredVehicle {
  vehicle: Vehicle
  score: number
  reasons: string[]
  warnings: string[]
}

const CATEGORY_FAMILY_FIT: Record<Vehicle['category'], Record<FamilySize, number>> = {
  cityCar: { solo: 10, couple: 8, family: 3, largeFamily: 1 },
  compact: { solo: 8, couple: 10, family: 7, largeFamily: 4 },
  sedan: { solo: 7, couple: 9, family: 8, largeFamily: 5 },
  estate: { solo: 5, couple: 8, family: 10, largeFamily: 9 },
  suv: { solo: 6, couple: 9, family: 10, largeFamily: 9 },
  utility: { solo: 3, couple: 5, family: 9, largeFamily: 10 },
}

export function scoreVehicle(vehicle: Vehicle, profile: LifestyleProfile): ScoredVehicle {
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0
  const dailyCommuteKm = profile.commuteOneWayKm * 2

  // 1) Budget — hard cap, with implicit used fallback (occasion @ ~65% du neuf)
  const usedPriceEstimate = vehicle.purchasePrice * 0.65
  const newFits = vehicle.purchasePrice <= profile.budgetMaxEur
  const usedFits = usedPriceEstimate <= profile.budgetMaxEur

  if (!newFits && !usedFits && usedPriceEstimate > profile.budgetMaxEur * 1.15) {
    return {
      vehicle,
      score: -100,
      reasons: [],
      warnings: [`Hors budget même en occasion (${Math.round(usedPriceEstimate).toLocaleString('fr-FR')} €)`],
    }
  }
  if (newFits) {
    score += 15
    reasons.push(`Tient dans le budget en neuf`)
  }
  else if (usedFits) {
    score += 12
    reasons.push(`Tient dans le budget en occasion`)
  }
  else {
    score += 4
    warnings.push(`Un peu au-dessus du budget, même en occasion`)
  }

  // 2) Family fit
  const familyFit = CATEGORY_FAMILY_FIT[vehicle.category][profile.family]
  score += familyFit
  if (familyFit >= 8)
    reasons.push(`Format adapté (${profile.family === 'largeFamily' ? 'grande famille' : profile.family === 'family' ? 'famille' : profile.family === 'couple' ? 'couple' : 'usage solo'})`)
  else if (familyFit <= 3)
    warnings.push(`Format un peu juste pour ce profil`)

  // 3) Energy fit based on trips and mileage
  const isEV = vehicle.energy === 'electric'
  const isHybrid = vehicle.energy === 'hybrid'
  const isPHEV = vehicle.energy === 'phev'
  const isThermal = vehicle.energy === 'gasoline' || vehicle.energy === 'diesel'

  // 3a) Charging access for EVs
  if (isEV) {
    if (profile.charging === 'none') {
      score -= 20
      warnings.push(`Recharge maison indisponible — EV peu pertinent sans wallbox`)
    }
    else if (profile.charging === 'wallbox') {
      score += 12
      reasons.push(`Wallbox maison = recharge nuit idéale`)
    }
    else {
      score += 6
      reasons.push(`Recharge prise standard possible`)
    }

    // Range vs daily commute (round trip)
    if (vehicle.wltpRangeKm && dailyCommuteKm > 0) {
      const realRange = vehicle.wltpRangeKm * 0.78
      const margin = realRange / dailyCommuteKm
      if (margin >= 3.0) {
        score += 12
        reasons.push(`Autonomie large pour ton trajet quotidien (${Math.round(realRange)} km réels)`)
      }
      else if (margin >= 2.0) {
        score += 8
        reasons.push(`Bonne marge d'autonomie quotidienne`)
      }
      else if (margin >= 1.2) {
        score += 3
        reasons.push(`Autonomie suffisante au quotidien`)
      }
      else if (margin >= 0.9) {
        score -= 6
        warnings.push(`Autonomie limite : recharge complète nécessaire chaque nuit`)
      }
      else {
        score -= 18
        warnings.push(`Autonomie insuffisante pour ton aller-retour quotidien`)
      }
    }

    // High highway = less efficient for EV (consumption + charging stops)
    if (profile.dominantTrip === 'highway') {
      score -= 6
      warnings.push(`Autoroute fréquente = surconsommation EV (~+30 % à 130 km/h)`)
      if (profile.annualKm > 20000) {
        score -= 8
        warnings.push(`Beaucoup d'autoroute + EV = arrêts de recharge nombreux`)
      }
    }
  }

  // 3b) Thermal
  if (isThermal) {
    if (profile.annualKm < 8000 && vehicle.energy === 'diesel') {
      score -= 10
      warnings.push(`Diesel peu rentable sous 10 000 km/an`)
    }
    if (profile.annualKm > 25000 && vehicle.energy === 'gasoline') {
      score -= 3
      warnings.push(`Beaucoup de km en essence = coût carburant élevé`)
    }
    if (profile.annualKm > 20000 && vehicle.energy === 'diesel') {
      score += 8
      reasons.push(`Diesel pertinent à fort kilométrage`)
    }
  }

  // 3c) Hybrid
  if (isHybrid) {
    if (profile.dominantTrip === 'urban' || profile.dominantTrip === 'mixed') {
      score += 10
      reasons.push(`Hybride excellent en urbain/mixte`)
    }
    if (profile.dominantTrip === 'highway') {
      score += 3
    }
    if (profile.charging === 'none') {
      score += 4
      reasons.push(`Aucune recharge requise`)
    }
  }

  // 3d) PHEV
  if (isPHEV) {
    if (profile.charging === 'none') {
      score -= 8
      warnings.push(`PHEV sans recharge = tu paies le surcoût sans bénéfice`)
    }
    else if (dailyCommuteKm < 60) {
      score += 12
      reasons.push(`PHEV idéal : trajets quotidiens en élec, longs trajets sans souci`)
    }
    else {
      score += 4
    }
  }

  // 4) Eco priority
  if (profile.ecoPriority === 'top') {
    if (isEV) {
      score += 12
      reasons.push(`Émissions directes nulles`)
    }
    else if (isHybrid || isPHEV) {
      score += 6
    }
    else if (vehicle.co2 > 140) {
      score -= 10
      warnings.push(`CO₂ élevé (${vehicle.co2} g/km) — peu compatible avec une priorité écologique`)
    }
    else if (vehicle.co2 > 110) {
      score -= 4
    }
  }
  else if (profile.ecoPriority === 'important') {
    if (isEV) {
      score += 5
    }
    else if (vehicle.co2 > 150) {
      score -= 4
    }
  }

  // 5) Annual mileage match
  if (profile.annualKm < 8000 && vehicle.category === 'cityCar') {
    score += 4
    reasons.push(`Petits volumes annuels = citadine parfaite`)
  }
  if (profile.annualKm > 25000 && (vehicle.category === 'sedan' || vehicle.category === 'estate')) {
    score += 3
    reasons.push(`Format confortable pour les gros rouleurs`)
  }

  // 6) Dominant trip × category
  if (profile.dominantTrip === 'urban' && vehicle.category === 'cityCar') {
    score += 5
    reasons.push(`Format compact = bonheur en ville`)
  }
  if (profile.dominantTrip === 'highway' && (vehicle.category === 'sedan' || vehicle.category === 'suv' || vehicle.category === 'estate')) {
    score += 3
  }
  if (profile.dominantTrip === 'urban' && vehicle.category === 'suv' && vehicle.curbWeight > 1700) {
    score -= 3
    warnings.push(`Gros gabarit peu pratique en ville`)
  }

  // 7) Parking constraint (neutral at 'normal')
  if (profile.parkingConstraint === 'tight') {
    if (vehicle.category === 'cityCar') {
      score += 6
      reasons.push(`Gabarit compact = parfait pour un stationnement serré`)
    }
    else if (vehicle.category === 'compact') {
      score += 2
    }
    else if (vehicle.category === 'utility') {
      score -= 8
      warnings.push(`Encombrant pour un stationnement serré`)
    }
    else if (vehicle.category === 'suv' || vehicle.category === 'estate') {
      score -= 5
      warnings.push(`Gabarit imposant à caser dans une place serrée`)
    }
  }
  else if (profile.parkingConstraint === 'easy' && (vehicle.category === 'suv' || vehicle.category === 'utility')) {
    score += 2
  }

  // 8) Cargo / load needs (neutral at 'occasional')
  if (profile.cargoNeeds === 'frequent') {
    if (vehicle.category === 'estate' || vehicle.category === 'utility') {
      score += 8
      reasons.push(`Grand volume de chargement pour tes besoins fréquents`)
    }
    else if (vehicle.category === 'suv') {
      score += 6
      reasons.push(`Coffre et modularité adaptés au transport régulier`)
    }
    else if (vehicle.category === 'cityCar') {
      score -= 8
      warnings.push(`Coffre trop juste pour transporter du volume souvent`)
    }
    else if (vehicle.category === 'compact') {
      score -= 2
    }
  }
  else if (profile.cargoNeeds === 'minimal') {
    if (vehicle.category === 'cityCar')
      score += 3
    else if (vehicle.category === 'utility') {
      score -= 4
      warnings.push(`Surdimensionné si tu ne transportes presque rien`)
    }
  }

  // 9) Ownership horizon (neutral around 4–7 years)
  if (profile.keepYears >= 8) {
    if (isEV) {
      score += 6
      reasons.push(`Détention longue = la décote initiale de l'EV est amortie`)
    }
    else if (vehicle.energy === 'diesel' && profile.annualKm > 18000) {
      score += 3
    }
  }
  else if (profile.keepYears <= 2) {
    if (isEV) {
      score -= 5
      warnings.push(`Revente rapide d'un EV = forte décote sur 2 ans`)
    }
    if (isPHEV) {
      score -= 3
    }
  }

  // 10) Long-trip frequency (neutral at 'sometimes')
  if (profile.longTrips === 'often') {
    if (isEV) {
      score -= 7
      warnings.push(`Longs trajets fréquents = arrêts de recharge réguliers`)
    }
    else if (isHybrid || isThermal) {
      score += 4
      reasons.push(`À l'aise sur les longs trajets sans contrainte de recharge`)
    }
  }
  else if (profile.longTrips === 'rarely' && isEV) {
    score += 4
    reasons.push(`Peu de longs trajets = l'autonomie n'est jamais un souci`)
  }

  return { vehicle, score, reasons, warnings }
}

export function rankVehicles(
  vehicles: readonly Vehicle[],
  profile: LifestyleProfile,
  limit = 5,
): ScoredVehicle[] {
  return vehicles
    .map(v => scoreVehicle(v, profile))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Find a "traditional" thermal comparator in the same category as the picked vehicle.
 * - Picked thermal (essence) → returns a diesel in same cat (or another essence)
 * - Picked thermal (diesel) → returns an essence in same cat (or another diesel)
 * - Picked EV/PHEV/hybrid → returns essence or diesel in same cat (essence preferred)
 * - Falls back to any thermal if no same-category match
 */
export function findTraditionalComparator(
  picked: Vehicle,
  vehicles: readonly Vehicle[],
): Vehicle | null {
  const pool = vehicles.filter(v => v.id !== picked.id)
  const sameCat = pool.filter(v => v.category === picked.category)

  if (picked.energy === 'gasoline') {
    return (
      sameCat.find(v => v.energy === 'diesel')
      ?? sameCat.find(v => v.energy === 'gasoline')
      ?? pool.find(v => v.energy === 'diesel')
      ?? pool.find(v => v.energy === 'gasoline')
      ?? null
    )
  }

  if (picked.energy === 'diesel') {
    return (
      sameCat.find(v => v.energy === 'gasoline')
      ?? sameCat.find(v => v.energy === 'diesel')
      ?? pool.find(v => v.energy === 'gasoline')
      ?? pool.find(v => v.energy === 'diesel')
      ?? null
    )
  }

  // Picked is electric/phev/hybrid → find a thermal
  return (
    sameCat.find(v => v.energy === 'gasoline')
    ?? sameCat.find(v => v.energy === 'diesel')
    ?? sameCat.find(v => v.energy === 'hybrid')
    ?? pool.find(v => v.energy === 'gasoline')
    ?? pool.find(v => v.energy === 'diesel')
    ?? null
  )
}

export const DEFAULT_LIFESTYLE: LifestyleProfile = {
  annualKm: 15000,
  dominantTrip: 'mixed',
  commuteOneWayKm: 20,
  family: 'couple',
  charging: 'standardPlug',
  budgetMaxEur: 30000,
  ecoPriority: 'important',
  parkingConstraint: 'normal',
  cargoNeeds: 'occasional',
  keepYears: 5,
  longTrips: 'sometimes',
}
