import type { PurchaseCondition, Vehicle } from '@cts/shared'

export interface ListingProvider {
  id: string
  label: string
  hint: string
  brandColor: string
  urlFor: (vehicle: Vehicle, condition: PurchaseCondition) => string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function maxYearFromCondition(condition: PurchaseCondition): number {
  const now = new Date().getFullYear()
  if (condition === 'new')
    return now
  if (condition === 'usedRecent')
    return now - 1
  return now - 3
}

function minYearFromCondition(condition: PurchaseCondition): number {
  const now = new Date().getFullYear()
  if (condition === 'new')
    return now - 1
  if (condition === 'usedRecent')
    return now - 5
  return now - 10
}

export const LISTING_PROVIDERS: ListingProvider[] = [
  {
    id: 'leboncoin',
    label: 'LeBonCoin',
    hint: 'Annonces particuliers et pros',
    brandColor: '#ff6e14',
    urlFor: (v, c) => {
      const q = encodeURIComponent(`${v.brand} ${v.searchModel}`)
      const params = new URLSearchParams({
        category: '2',
        text: `${v.brand} ${v.searchModel}`,
        regdate: `${minYearFromCondition(c)}-${maxYearFromCondition(c)}`,
      })
      return `https://www.leboncoin.fr/recherche?${params.toString()}&q=${q}`
    },
  },
  {
    id: 'lacentrale',
    label: 'La Centrale',
    hint: 'Site spécialisé voiture',
    brandColor: '#e30613',
    urlFor: (v, c) => {
      const params = new URLSearchParams({
        makesModelsCommercialNames: `${v.brand.toUpperCase()}:${v.searchModel.toUpperCase()}`,
        yearMin: String(minYearFromCondition(c)),
        yearMax: String(maxYearFromCondition(c)),
      })
      return `https://www.lacentrale.fr/listing?${params.toString()}`
    },
  },
  {
    id: 'autoscout24',
    label: 'AutoScout24',
    hint: 'Marché européen',
    brandColor: '#e57700',
    urlFor: (v, c) => {
      const params = new URLSearchParams({
        atype: 'C',
        cy: 'F',
        q: `${v.brand} ${v.searchModel}`,
        fregfrom: String(minYearFromCondition(c)),
        fregto: String(maxYearFromCondition(c)),
      })
      return `https://www.autoscout24.fr/lst?${params.toString()}`
    },
  },
  {
    id: 'largus',
    label: 'L\'Argus',
    hint: 'Cote + annonces',
    brandColor: '#0067b1',
    urlFor: (v) => {
      const q = encodeURIComponent(`${v.brand} ${v.searchModel}`)
      return `https://www.largus.fr/recherche?q=${q}`
    },
  },
  {
    id: 'aramisauto',
    label: 'Aramisauto',
    hint: 'Concessionnaire occasion',
    brandColor: '#003a78',
    urlFor: (v) => {
      const brand = slugify(v.brand)
      const model = slugify(v.searchModel)
      return `https://www.aramisauto.com/achat/${brand}/${model}/offres/`
    },
  },
]

export function useListingLinks(vehicle: Vehicle, condition: PurchaseCondition) {
  return LISTING_PROVIDERS.map(p => ({
    ...p,
    href: p.urlFor(vehicle, condition),
  }))
}
