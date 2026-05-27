const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const eurPreciseFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export function formatEuro(value: number, precise = false): string {
  if (!Number.isFinite(value))
    return '—'
  return (precise ? eurPreciseFormatter : eurFormatter).format(value)
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value))
    return '—'
  return numberFormatter.format(value)
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value))
    return '—'
  return percentFormatter.format(value / 100)
}

export function formatKm(value: number): string {
  return `${formatNumber(value)} km`
}

export function formatYears(value: number): string {
  return value === 1 ? '1 an' : `${value} ans`
}
