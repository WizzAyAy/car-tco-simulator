import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { Hono } from 'hono'
import satori from 'satori'

type SatoriElement = Parameters<typeof satori>[0]

const PALETTE = {
  bg: '#FAFAF9',
  ink: '#0A0A0B',
  muted: '#6B7280',
  green: '#10B981',
  border: '#E7E5E4',
} as const

const WIDTH = 1200
const HEIGHT = 630

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../assets')

let fontsPromise: Promise<Array<{ name: string, data: Buffer, weight: 400 | 600 | 800, style: 'normal' }>> | null = null

async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(path.join(assetsDir, 'Inter-Regular.ttf')),
      readFile(path.join(assetsDir, 'Inter-SemiBold.ttf')),
      readFile(path.join(assetsDir, 'Inter-ExtraBold.ttf')),
    ]).then(([regular, semiBold, extraBold]) => [
      { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: semiBold, weight: 600 as const, style: 'normal' as const },
      { name: 'Inter', data: extraBold, weight: 800 as const, style: 'normal' as const },
    ])
  }
  return fontsPromise
}

function formatEuro(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value))} €`
}

function durationLabel(years: number): string {
  return years <= 1 ? '1 an' : `${years} ans`
}

type OgParams = {
  winner: string
  loser: string
  savings: number
  duration: number
  isTie: boolean
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function buildScene(params: OgParams): SatoriElement {
  const heroValue = params.isTie ? 'Égalité' : `−${formatEuro(params.savings)}`
  const overline = params.isTie
    ? `${clamp(params.winner, 28)}  vs  ${clamp(params.loser, 28)}`
    : `${clamp(params.winner, 32)} économise`
  const subline = params.isTie
    ? `Coût quasi identique sur ${durationLabel(params.duration)}`
    : `vs ${clamp(params.loser, 36)} · sur ${durationLabel(params.duration)}`

  const scene = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: PALETTE.bg,
        padding: '72px',
        justifyContent: 'space-between',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', fontSize: 30, color: PALETTE.muted, fontWeight: 600 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: PALETTE.green,
                    marginRight: '16px',
                  },
                  children: '',
                },
              },
              { type: 'div', props: { style: { letterSpacing: '-0.01em' }, children: 'Car TCO Simulator' } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: 34, color: PALETTE.ink, fontWeight: 600, marginBottom: '8px' },
                  children: overline,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: params.isTie ? 150 : 190,
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: params.isTie ? PALETTE.ink : PALETTE.green,
                  },
                  children: heroValue,
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: 38, color: PALETTE.muted, marginTop: '24px', fontWeight: 400 },
                  children: subline,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              borderTop: `1px solid ${PALETTE.border}`,
              paddingTop: '28px',
              fontSize: 26,
              color: PALETTE.muted,
              fontWeight: 400,
            },
            children: 'Coût total d’usage : carburant, entretien, assurance, dépréciation — tout inclus.',
          },
        },
      ],
    },
  }

  return scene as unknown as SatoriElement
}

function parseParams(query: Record<string, string | undefined>): OgParams {
  const winner = (query.winner ?? 'Voiture A').slice(0, 60)
  const loser = (query.loser ?? 'Voiture B').slice(0, 60)
  const savings = Math.max(0, Number(query.savings) || 0)
  const durationRaw = Math.round(Number(query.duration) || 5)
  const duration = Math.min(15, Math.max(1, durationRaw))
  const isTie = query.tie === '1' || savings < 100
  return { winner, loser, savings, duration, isTie }
}

export const og = new Hono()

og.get('/', async (c) => {
  const params = parseParams({
    winner: c.req.query('winner'),
    loser: c.req.query('loser'),
    savings: c.req.query('savings'),
    duration: c.req.query('duration'),
    tie: c.req.query('tie'),
  })

  const fonts = await loadFonts()
  const svg = await satori(buildScene(params), { width: WIDTH, height: HEIGHT, fonts })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
  const png = resvg.render().asPng()
  const body = new Uint8Array(png.byteLength)
  body.set(png)

  c.header('Content-Type', 'image/png')
  c.header('Cache-Control', 'public, max-age=86400, immutable')
  return c.body(body)
})
