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

/**
 * Display groups for the breakdown chart — the 14 fine categories collapse into
 * 4 readable buckets. The engine keeps the fine categories (tooltips, other
 * slides); only this chart merges them. Colors are spaced steps of the
 * signature neon green→cyan so the stack stays cohesive with the nav/verdict.
 */
export interface BreakdownGroup {
  id: string
  label: string
  color: string
  categories: CostCategory[]
}

export const BREAKDOWN_GROUPS: BreakdownGroup[] = [
  { id: 'depreciation', label: 'Dépréciation', color: '#34e89e', categories: ['depreciation'] },
  { id: 'energy', label: 'Énergie', color: '#22d3ee', categories: ['energy'] },
  { id: 'financing', label: 'Financement', color: '#15a58e', categories: ['financing', 'leasing'] },
  {
    id: 'usage',
    label: 'Usage',
    color: '#8df0cd',
    categories: ['maintenance', 'repairs', 'tires', 'consumables', 'insurance', 'controlTechnique', 'parking', 'registration', 'malus', 'carbon'],
  },
]

/**
 * Fine per-category palette — a single monochrome ramp along the signature neon
 * green→cyan (DESIGN.md §2). Every poste is a shade of the same glowy accent;
 * only lightness/hue step between segments so the stack stays cohesive with the
 * nav selector and verdict, never a rainbow.
 */
export const CATEGORY_COLORS: Record<CostCategory, string> = {
  depreciation: '#34e89e',
  energy: '#22d3ee',
  insurance: '#8df0cd',
  maintenance: '#15a58e',
  repairs: '#4ee3a8',
  tires: '#43d9e6',
  leasing: '#2dd4bf',
  financing: '#18b89a',
  malus: '#6ff2c0',
  parking: '#1aa0a8',
  controlTechnique: '#46ddb0',
  registration: '#5fe1ee',
  consumables: '#2ec9a6',
  carbon: '#b6f3d8',
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
