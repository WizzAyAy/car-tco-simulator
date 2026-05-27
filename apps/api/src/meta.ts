import { buildDefaultInput, buildVerdictSummary, compareTCO, computeTCO, findPresetById } from '@cts/shared'

const COMPARE_ROUTE = /^\/compare\/([a-z0-9-]+)-vs-([a-z0-9-]+)\/?$/i

interface SocialMeta {
  title: string
  description: string
  image: string
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildOgImageUrl(origin: string, winner: string, loser: string, savings: number, duration: number, isTie: boolean): string {
  const params = new URLSearchParams({
    winner,
    loser,
    savings: String(Math.round(savings)),
    duration: String(duration),
  })
  if (isTie)
    params.set('tie', '1')
  return `${origin}/api/og?${params.toString()}`
}

/**
 * Resolves a `/compare/:slugA-vs-:slugB` pathname into the per-comparison
 * social metadata, computing the verdict with the default profile so that
 * non-JS crawlers (Facebook, LinkedIn, Twitter) unfurl the real comparison.
 * Returns `null` when the path is not a compare route or the slugs (which are
 * preset ids) do not resolve, so the caller can fall back to static tags.
 */
export function resolveCompareMeta(pathname: string, origin: string): SocialMeta | null {
  const match = COMPARE_ROUTE.exec(pathname)
  if (!match)
    return null

  const [, slugA, slugB] = match
  const vehicleA = slugA ? findPresetById(slugA) : undefined
  const vehicleB = slugB ? findPresetById(slugB) : undefined
  if (!vehicleA || !vehicleB)
    return null

  const duration = 5
  const resultA = computeTCO(buildDefaultInput(vehicleA, { durationYears: duration }))
  const resultB = computeTCO(buildDefaultInput(vehicleB, { durationYears: duration }))

  const compared = compareTCO(resultA, resultB)
  const comparison = { a: resultA, b: resultB, ...compared }
  const summary = buildVerdictSummary(comparison, vehicleA.label, vehicleB.label, duration)

  const isTie = compared.winner === 'tie'
  const winnerLabel = compared.winner === 'b' ? vehicleB.label : vehicleA.label
  const loserLabel = compared.winner === 'b' ? vehicleA.label : vehicleB.label

  return {
    title: `${summary.headline} · Car TCO Simulator`,
    description: `${summary.headline} — ${summary.sub}. Coût total d'usage tout inclus : `
      + `carburant ou électricité, entretien, assurance, dépréciation, malus et financement.`,
    image: buildOgImageUrl(origin, winnerLabel, loserLabel, compared.savings, duration, isTie),
  }
}

/**
 * Rewrites the social meta tags (`og:*`, `twitter:*`, `<title>`, description)
 * in a static index.html string with per-comparison values. Falls back to the
 * untouched html when `meta` is `null`.
 */
export function injectSocialMeta(html: string, meta: SocialMeta | null): string {
  if (!meta)
    return html

  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const image = escapeAttr(meta.image)

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+property="og:title"\s+content=")[\s\S]*?(")/,
      `$1${title}$2`,
    )
    .replace(
      /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+property="og:image"\s+content=")[\s\S]*?(")/,
      `$1${image}$2`,
    )
    .replace(
      /(<meta\s+name="twitter:title"\s+content=")[\s\S]*?(")/,
      `$1${title}$2`,
    )
    .replace(
      /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+name="twitter:image"\s+content=")[\s\S]*?(")/,
      `$1${image}$2`,
    )
}

/**
 * Derives the absolute origin (`protocol://host`) from the incoming request,
 * honouring reverse-proxy headers so the injected `og:image` URL points back
 * at the same host serving the page.
 */
export function originFromRequest(url: string, headers: { get: (name: string) => string | null }): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (host) {
    const proto = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return new URL(url).origin
}
