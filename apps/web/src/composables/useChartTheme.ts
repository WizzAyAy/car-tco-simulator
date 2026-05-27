import type { CostCategory } from '@cts/shared'

export const SERIES_COLORS = {
  A: '#0a0a0b',
  B: '#059669',
  Aoutline: '#a8a29e',
  Boutline: '#34d399',
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
  depreciation: 'Dépréciation',
  carbon: 'Coût carbone',
}

export const CATEGORY_COLORS: Record<CostCategory, string> = {
  energy: '#0284c7',
  maintenance: '#7c3aed',
  tires: '#475569',
  consumables: '#94a3b8',
  insurance: '#db2777',
  controlTechnique: '#a16207',
  parking: '#9333ea',
  registration: '#65a30d',
  malus: '#dc2626',
  repairs: '#ea580c',
  financing: '#0891b2',
  depreciation: '#0a0a0b',
  carbon: '#16a34a',
}

export const BASE_CHART_OPTIONS = {
  textStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#44403c',
  },
  grid: {
    left: 56,
    right: 24,
    top: 32,
    bottom: 44,
  },
  tooltip: {
    backgroundColor: '#0a0a0b',
    borderColor: '#0a0a0b',
    textStyle: { color: '#fafaf9', fontFamily: 'Inter, system-ui, sans-serif' },
    padding: [10, 12],
  },
}
