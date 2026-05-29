import type { CostCategory } from '@cts/shared'

const FONT = 'Inter, system-ui, sans-serif'

/** Series identity — A neutral light, B neon accent (matches DESIGN.md §2). */
export const SERIES_COLORS = {
  A: '#cdd3df',
  B: '#34e89e',
  Aoutline: '#8a93a3',
  Boutline: '#22d3ee',
}

/** Neon glow applied to the highlighted (B) line/area. */
export const ACCENT_GLOW = {
  shadowColor: 'rgba(52, 232, 158, 0.55)',
  shadowBlur: 16,
}

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  energy: 'Carburant / Électricité',
  maintenance: 'Entretien',
  tires: 'Pneus',
  consumables: 'Consommables',
  insurance: 'Assurance',
  controlTechnique: 'Contrôle technique',
  parking: 'Stationnement',
  registration: 'Carte grise',
  malus: 'Bonus / Malus',
  repairs: 'Réparations',
  financing: 'Intérêts du crédit',
  leasing: 'Loyers LOA',
  depreciation: 'Dépréciation',
  carbon: 'Coût carbone',
}

/** Category palette tuned for a dark canvas — luminous, never pure black. */
export const CATEGORY_COLORS: Record<CostCategory, string> = {
  energy: '#38bdf8',
  maintenance: '#a78bfa',
  tires: '#94a3b8',
  consumables: '#cbd5e1',
  insurance: '#f472b6',
  controlTechnique: '#fbbf24',
  parking: '#c084fc',
  registration: '#a3e635',
  malus: '#fb6f6f',
  repairs: '#fb923c',
  financing: '#22d3ee',
  leasing: '#2dd4bf',
  depreciation: '#cdd3df',
  carbon: '#34e89e',
}

/* Shared dark axis / legend / grid styling — consumed by every chart so no
   component hardcodes light-mode hex. */
export const AXIS_LABEL = { color: '#8a93a3', fontSize: 12 }
export const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.14)' } }
export const SPLIT_LINE = { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' as const } }
export const LEGEND_TEXT = { color: '#a8b0bf' }

export const BASE_CHART_OPTIONS = {
  textStyle: {
    fontFamily: FONT,
    color: '#a8b0bf',
  },
  grid: {
    left: 56,
    right: 24,
    top: 32,
    bottom: 44,
  },
  tooltip: {
    backgroundColor: 'rgba(19, 22, 29, 0.92)',
    borderColor: 'rgba(52, 232, 158, 0.35)',
    borderWidth: 1,
    textStyle: { color: '#f4f6fb', fontFamily: FONT },
    extraCssText: 'backdrop-filter: blur(8px); border-radius: 10px; box-shadow: 0 8px 30px -8px rgba(0,0,0,0.6);',
    padding: [10, 12],
  },
}
