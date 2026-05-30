// Offline generator: pulls CC-licensed vehicle photos from Wikimedia Commons,
// self-hosts the thumbnails under apps/web/public/vehicles/, and writes the
// attribution map to packages/shared/src/vehicles/images.generated.ts.
//
// Run: node scripts/fetch-vehicle-images.mjs
//
// Compliance: only stores images whose license is Creative Commons / public
// domain, and records author + license + source page for attribution (required
// by CC BY / BY-SA). Review the generated map before committing — auto-matched
// images can be wrong; fix the TITLES map and re-run.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const IMG_DIR = resolve(ROOT, 'apps/web/public/vehicles')
const OUT_TS = resolve(ROOT, 'packages/shared/src/vehicles/images.generated.ts')
const UA = 'CarTCOSimulator/1.0 (contact: quentin.maignan@ignimission.com)'

// preset id → Wikipedia article title(s). Trims of the same model share one
// image (cached by title). A value may be an array of candidate titles, tried
// in order across fr then en Wikipedia until a CC-licensed lead image is found.
const TITLES = {
  // — Renault —
  'clio-essence': 'Renault Clio V',
  'clio-diesel': 'Renault Clio V',
  'clio-etech-hybrid': 'Renault Clio V',
  'clio3-essence-2009': ['Renault Clio III', 'Renault Clio V'],
  'clio3-diesel-2010': ['Renault Clio III', 'Renault Clio V'],
  'clio4-essence-2013': ['Renault Clio IV', 'Renault Clio V'],
  'clio4-diesel-2013': ['Renault Clio IV', 'Renault Clio V'],
  'zoe-electric': 'Renault Zoé',
  'zoe-q210-electric-2013': 'Renault Zoé',
  'megane-estate-essence': 'Renault Mégane IV',
  'megane-estate-hybrid': 'Renault Mégane IV',
  'megane3-essence-2009': ['Renault Mégane III', 'Renault Mégane IV'],
  'megane3-diesel-2010': ['Renault Mégane III', 'Renault Mégane IV'],
  'megane3-estate-diesel-2010': ['Renault Mégane III', 'Renault Mégane IV'],
  'megane-etech-electric': 'Renault Mégane E-Tech Electric',
  'captur-essence': 'Renault Captur II',
  'captur-etech-hybrid': 'Renault Captur II',
  'captur-phev': 'Renault Captur II',
  'sandero-essence': 'Dacia Sandero',
  'duster-essence': 'Dacia Duster',
  'duster-hybrid': 'Dacia Duster',
  'duster-diesel': 'Dacia Duster',
  'duster-1-diesel-2012': ['Dacia Duster', 'Dacia Duster I'],
  'jogger-hybrid': 'Dacia Jogger',
  'jogger-essence': 'Dacia Jogger',
  'spring-electric': 'Dacia Spring',
  'kangoo-diesel': 'Renault Kangoo',
  'kangoo-etech-electric': 'Renault Kangoo',
  'kangoo-2-diesel-2010': ['Renault Kangoo II', 'Renault Kangoo'],
  'koleos-1-diesel-2010': ['Renault Koleos', 'Renault Koleos I'],
  'laguna3-diesel-2009': ['Renault Laguna III', 'Renault Laguna'],
  'twingo-2-essence-2008': ['Renault Twingo II', 'Renault Twingo'],
  'austral-etech-hybrid': 'Renault Austral',
  'rafale-phev': ['Renault Rafale (automobile)', 'Renault Rafale'],
  'scenic-etech-electric': ['Renault Scénic E-Tech', 'Renault Scénic'],
  'symbioz-hybrid': ['Renault Symbioz (2024)', 'Renault Symbioz'],
  'r4-etech-electric': ['Renault 4 E-Tech', 'Renault 4 E-Tech Electric'],
  'r5-etech-electric': ['Renault 5 E-Tech', 'Renault 5 E-Tech Electric'],
  // — Peugeot —
  'e208-electric': 'Peugeot 208 II',
  '208-essence': 'Peugeot 208 II',
  'peugeot-208-1-essence-2012': ['Peugeot 208 I', 'Peugeot 208'],
  'peugeot-208-1-diesel-2012': ['Peugeot 208 I', 'Peugeot 208'],
  'peugeot-207-essence-2008': 'Peugeot 207',
  'peugeot-207-diesel-2009': 'Peugeot 207',
  '2008-essence': 'Peugeot 2008 II',
  'e2008-electric': 'Peugeot 2008 II',
  '3008-hybrid': 'Peugeot 3008 II',
  '3008-phev': 'Peugeot 3008 II',
  '3008-diesel': 'Peugeot 3008 II',
  'peugeot-3008-1-diesel-2010': ['Peugeot 3008 I', 'Peugeot 3008'],
  '308-essence': 'Peugeot 308 III',
  '308-hybrid': 'Peugeot 308 III',
  '308-diesel': 'Peugeot 308 III',
  '308-phev': 'Peugeot 308 III',
  'e308-electric': 'Peugeot 308 III',
  '308-sw-essence': 'Peugeot 308 III',
  '308-sw-hybrid': 'Peugeot 308 III',
  'peugeot-308-t7-essence-2008': ['Peugeot 308 I', 'Peugeot 308'],
  'peugeot-308-t7-diesel-2009': ['Peugeot 308 I', 'Peugeot 308'],
  'peugeot-308-sw-t7-diesel-2010': ['Peugeot 308 I', 'Peugeot 308'],
  'peugeot-308-t9-diesel-2014': ['Peugeot 308 II', 'Peugeot 308'],
  'peugeot-407-diesel-2008': 'Peugeot 407',
  '508-essence': 'Peugeot 508 II',
  '508-diesel': 'Peugeot 508 II',
  '508-sw-hybrid': 'Peugeot 508 II',
  'peugeot-508-1-diesel-2011': ['Peugeot 508 I', 'Peugeot 508'],
  'rifter-essence': 'Peugeot Rifter',
  'rifter-diesel': 'Peugeot Rifter',
  'erifter-electric': 'Peugeot Rifter',
  'partner-2-diesel-2010': ['Peugeot Partner', 'Peugeot Partner II'],
  // — Citroën —
  'c3-essence': 'Citroën C3 III',
  'ec3-electric': ['Citroën ë-C3', 'Citroën C3'],
  'citroen-c3-2-essence-2009': ['Citroën C3 II', 'Citroën C3'],
  'ec3-aircross-electric': 'Citroën C3 Aircross',
  'aygox-essence-c3-aircross': 'Citroën C3 Aircross',
  'c4-essence': 'Citroën C4 III',
  'ec4-electric': ['Citroën ë-C4', 'Citroën C4'],
  'citroen-c4-2-essence-2009': ['Citroën C4 II', 'Citroën C4'],
  'c1-essence-2008': 'Citroën C1',
  'berlingo-essence': 'Citroën Berlingo III',
  'eberlingo-electric': 'Citroën Berlingo III',
  'berlingo-diesel': 'Citroën Berlingo III',
  'berlingo-2-diesel-2010': ['Citroën Berlingo II', 'Citroën Berlingo'],
  // — Volkswagen —
  'golf-essence': 'Volkswagen Golf VIII',
  'golf-diesel': 'Volkswagen Golf VIII',
  'golf-ehybrid-phev': 'Volkswagen Golf VIII',
  'golf-sw-essence': 'Volkswagen Golf VIII',
  'golf6-essence-2009': ['Volkswagen Golf VI', 'Volkswagen Golf'],
  'golf6-diesel-2010': ['Volkswagen Golf VI', 'Volkswagen Golf'],
  'golf6-sw-diesel-2010': ['Volkswagen Golf VI', 'Volkswagen Golf'],
  'golf7-essence-2013': ['Volkswagen Golf VII', 'Volkswagen Golf'],
  'golf7-diesel-2013': ['Volkswagen Golf VII', 'Volkswagen Golf'],
  'polo-essence': 'Volkswagen Polo VI',
  'polo-5-essence-2010': ['Volkswagen Polo V', 'Volkswagen Polo'],
  'passat-sw-diesel': 'Volkswagen Passat B8',
  'passat-b6-diesel-2009': ['Volkswagen Passat B6', 'Volkswagen Passat'],
  'passat-sw-b6-diesel-2009': ['Volkswagen Passat B6', 'Volkswagen Passat'],
  'tiguan-essence': 'Volkswagen Tiguan',
  'tiguan-diesel': 'Volkswagen Tiguan',
  'tiguan-1-diesel-2010': ['Volkswagen Tiguan', 'Volkswagen Tiguan I'],
  'caddy-diesel': 'Volkswagen Caddy',
  'caddy-3-diesel-2011': 'Volkswagen Caddy',
  'id3-electric': 'Volkswagen ID.3',
  'id4-electric': 'Volkswagen ID.4',
  // — Toyota —
  'yaris-hybrid': 'Toyota Yaris',
  'yaris-2-essence-2009': ['Toyota Yaris (XP90)', 'Toyota Yaris'],
  'yaris-2-hybrid-2013': ['Toyota Yaris (XP130)', 'Toyota Yaris'],
  'yariscross-hybrid': 'Toyota Yaris Cross',
  'aygox-essence': 'Toyota Aygo X',
  'corolla-hybrid': 'Toyota Corolla',
  'corolla-sedan-essence': 'Toyota Corolla',
  'corolla-sedan-hybrid': 'Toyota Corolla',
  'corolla-ts-hybrid': 'Toyota Corolla',
  'auris-1-essence-2010': 'Toyota Auris',
  'chr-hybrid': 'Toyota C-HR',
  'rav4-hybrid': 'Toyota RAV4',
  'rav4-3-diesel-2010': 'Toyota RAV4',
  'prius3-hybrid-2010': 'Toyota Prius',
  // — Tesla —
  'model3-electric': 'Tesla Model 3',
  'model3-lr-electric': 'Tesla Model 3',
  'modely-electric': 'Tesla Model Y',
  'modely-lr-electric': 'Tesla Model Y',
  'modely-perf-electric': 'Tesla Model Y',
  // — Hyundai —
  'i10-essence': 'Hyundai i10',
  'i20-essence': 'Hyundai i20',
  'kona-electric': 'Hyundai Kona',
  'tucson-hybrid': 'Hyundai Tucson',
  'tucson-diesel': 'Hyundai Tucson',
  'tucson-essence': 'Hyundai Tucson',
  'ioniq-hybrid': 'Hyundai Ioniq',
  'ioniq5-electric': 'Hyundai Ioniq 5',
  'hyundai-inster-electric': 'Hyundai Inster',
  'ix35-diesel-2011': 'Hyundai ix35',
  // — Kia —
  'picanto-essence': 'Kia Picanto',
  'ceed-hybrid': 'Kia Ceed',
  'niro-hybrid': 'Kia Niro',
  'kia-niro-ev-electric': 'Kia Niro',
  'ev6-electric': 'Kia EV6',
  'kia-ev3-electric': 'Kia EV3',
  'sportage-phev': 'Kia Sportage',
  'sportage-diesel': 'Kia Sportage',
  'sportage-essence': 'Kia Sportage',
  'sportage-3-diesel-2011': 'Kia Sportage',
  // — Ford —
  'fiesta-6-essence-2010': 'Ford Fiesta',
  'focus-diesel': 'Ford Focus',
  'focus-sw-essence': 'Ford Focus',
  'focus2-essence-2008': 'Ford Focus',
  'kuga-diesel': 'Ford Kuga',
  'kuga-1-diesel-2010': 'Ford Kuga',
  'mondeo-sw-4-diesel-2009': 'Ford Mondeo',
  'puma-essence': ['Ford Puma (2019)', 'Ford Puma (crossover)'],
  'tourneo-connect-electric': ['Ford Tourneo Connect', 'Ford Transit Connect'],
  // — Opel —
  'corsa-essence': 'Opel Corsa',
  'i20-electric-corsa': 'Opel Corsa',
  'corsa-d-essence-2009': ['Opel Corsa D', 'Opel Corsa'],
  'astra-diesel': 'Opel Astra',
  'astra-j-essence-2010': ['Opel Astra J', 'Opel Astra'],
  'mokka-essence': 'Opel Mokka',
  'mokka-electric': 'Opel Mokka',
  'combo-diesel': ['Opel Combo', 'Opel Combo Life'],
  'comboe-electric': ['Opel Combo', 'Opel Combo Life'],
  'frontera-hybrid': ['en:Opel Frontera (2024)'],
  // — BMW —
  'bmw-serie1-essence': 'BMW Série 1',
  'bmw-serie1-e87-essence-2009': ['BMW Série 1 E87', 'BMW Série 1'],
  'bmw-serie3-essence': 'BMW Série 3',
  'bmw-320d-diesel': 'BMW Série 3',
  'bmw-330e-phev': 'BMW Série 3',
  'bmw-serie3-touring-diesel': 'BMW Série 3',
  'bmw-320d-e90-diesel-2009': ['BMW Série 3 E90', 'BMW Série 3'],
  'bmw-320d-f30-diesel-2013': ['BMW Série 3 F30', 'BMW Série 3'],
  'bmw-x3-f25-diesel-2011': ['BMW X3 F25', 'BMW X3'],
  'bmw-i4': 'BMW i4',
  // — Mercedes —
  'mercedes-classe-a-essence': 'Mercedes-Benz Classe A',
  'mercedes-classe-a-w176-diesel-2013': ['Mercedes-Benz Classe A (W176)', 'Mercedes-Benz Classe A'],
  'mercedes-c220d-diesel': 'Mercedes-Benz Classe C',
  'mercedes-c220d-w204-diesel-2010': ['Mercedes-Benz Classe C (W204)', 'Mercedes-Benz Classe C'],
  'mercedes-glc300e-phev': 'Mercedes-Benz GLC',
  // — Audi —
  'audi-a3-essence': 'Audi A3',
  'audi-a3-8p-essence-2008': ['Audi A3 (8P)', 'Audi A3'],
  'audi-a3-8v-essence-2013': ['Audi A3 (8V)', 'Audi A3'],
  'audi-a4-avant-diesel': 'Audi A4',
  'audi-a4-b8-diesel-2009': ['Audi A4 (B8)', 'Audi A4'],
  'audi-a4-avant-b8-diesel-2009': ['Audi A4 (B8)', 'Audi A4'],
  'audi-q3-essence': 'Audi Q3',
  'audi-q5-8r-diesel-2010': ['Audi Q5', 'Audi Q5 (8R)'],
  'q4-etron': 'Audi Q4 e-tron',
  // — Skoda —
  'octavia-essence': 'Škoda Octavia',
  'octavia-diesel': 'Škoda Octavia',
  'octavia-combi-2-diesel-2009': 'Škoda Octavia',
  'superb-essence': 'Škoda Superb',
  'superb-diesel': 'Škoda Superb',
  'superb-combi-diesel': 'Škoda Superb',
  'kamiq-essence': 'Škoda Kamiq',
  'enyaq-electric': 'Škoda Enyaq',
  'elroq-electric': 'Škoda Elroq',
  // — Seat / Cupra —
  'ibiza-essence': 'Seat Ibiza',
  'leon-diesel': 'Seat Leon',
  'leon-ehybrid-phev': 'Cupra Leon',
  'cupra-born-electric': 'Cupra Born',
  'cupra-formentor-phev': 'Cupra Formentor',
  // — Fiat —
  'fiat500-hybrid': ['Fiat 500 (2007)', 'Fiat 500'],
  'fiat500e-electric': ['Fiat 500 électrique', 'Fiat 500e', 'Fiat 500 (2020)'],
  'fiat500-essence-2010': ['Fiat 500 (2007)', 'Fiat 500'],
  'doblo-2-diesel-2011': 'Fiat Doblo',
  // — Honda —
  'civic-hybrid': 'Honda Civic',
  'civic-8-essence-2008': 'Honda Civic',
  'hrv-hybrid': 'Honda HR-V',
  'jazz-hybrid': 'Honda Jazz',
  // — Nissan —
  'juke-essence': 'Nissan Juke',
  'leaf-1-electric-2013': 'Nissan Leaf',
  'qashqai-epower-hybrid': 'Nissan Qashqai',
  'qashqai-diesel': 'Nissan Qashqai',
  'qashqai-j10-diesel-2009': ['Nissan Qashqai', 'Nissan Qashqai J10'],
  // — Mini —
  'mini-cooper-e': ['Mini Cooper (2024)', 'Mini Hatch'],
  'mini-cooper-r56-essence-2010': ['Mini Hatch', 'Mini Cooper'],
  // — Suzuki —
  'swift-hybrid': 'Suzuki Swift',
  'swace-hybrid': 'Suzuki Swace',
  // — Mazda —
  'mazda6-essence': ['Mazda 6', 'Mazda Mazda6'],
  // — MG —
  'mg4-electric': ['MG4', 'MG4 EV', 'MG 4'],
  'mgzs-electric': ['MG ZS', 'MG ZS EV'],
  // — BYD —
  'byd-atto3': 'BYD Atto 3',
  'byd-dolphin-electric': 'BYD Dolphin',
  'seal-dmi-hybrid': 'BYD Seal',
  // — Other EV brands —
  'polestar2': 'Polestar 2',
  'volvo-ex30-electric': 'Volvo EX30',
  'smart-hashtag1-electric': ['Smart #1', 'Smart #1 (HX11)'],
  'jeep-avenger-electric': 'Jeep Avenger',
  'leapmotor-b10-electric': ['en:Leapmotor B10'],
}

const CC_OK = /\b(?:cc|creative commons|public domain|cc0|pdm)\b/i
const HOSTS = ['fr.wikipedia.org', 'en.wikipedia.org']

function stripHtml(s) {
  return (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Wikimedia is strict on rate limits — throttle every request and back off on 429/503.
async function politeFetch(url) {
  for (let attempt = 0; ; attempt++) {
    await sleep(250)
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.status === 429 || res.status === 503) {
      if (attempt >= 5)
        throw new Error(`${res.status} (gave up after ${attempt} retries)`)
      await sleep(2000 * 2 ** attempt)
      continue
    }
    return res
  }
}

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`
  const res = await politeFetch(url)
  if (!res.ok)
    throw new Error(`${host} ${res.status}`)
  return res.json()
}

async function resolveOnHost(host, title) {
  const data = await api(host, {
    action: 'query',
    prop: 'pageimages',
    piprop: 'name|thumbnail',
    pithumbsize: '720',
    titles: title,
    redirects: '1',
  })
  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page?.thumbnail?.source || !page?.pageimage)
    return null

  const info = await api('commons.wikimedia.org', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'extmetadata',
    titles: `File:${page.pageimage}`,
  })
  const ip = Object.values(info.query?.pages ?? {})[0]
  const meta = ip?.imageinfo?.[0]?.extmetadata ?? {}
  const license = stripHtml(meta.LicenseShortName?.value) || 'Inconnue'
  if (!CC_OK.test(license))
    return { skip: license }
  return {
    thumb: page.thumbnail.source,
    file: page.pageimage,
    author: stripHtml(meta.Artist?.value) || 'Auteur inconnu',
    license,
    licenseUrl: stripHtml(meta.LicenseUrl?.value) || '',
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`,
  }
}

// A TITLES value is a string or an array of candidate article titles, tried in
// order across fr then en Wikipedia until a CC-licensed lead image is found.
async function resolveTitle(value) {
  const candidates = Array.isArray(value) ? value : [value]
  let lastSkip = null
  for (const raw of candidates) {
    // "en:Title" / "fr:Title" forces a single host (use when fr's lead image is the wrong car).
    const m = /^(fr|en):(.+)$/.exec(raw)
    const title = m ? m[2] : raw
    const hosts = m ? [`${m[1]}.wikipedia.org`] : HOSTS
    for (const host of hosts) {
      try {
        const r = await resolveOnHost(host, title)
        if (r?.skip) {
          lastSkip = `${title}@${host}: ${r.skip}`
          continue
        }
        if (r)
          return r
      }
      catch { /* try next host/candidate */ }
    }
  }
  if (lastSkip)
    console.warn(`  ⚠ non-CC: ${lastSkip}`)
  return null
}

async function download(url, dest) {
  const res = await politeFetch(url)
  if (!res.ok)
    throw new Error(`download ${res.status}`)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true })
  const cache = new Map()
  const entries = {}

  for (const [id, title] of Object.entries(TITLES)) {
    const key = JSON.stringify(title)
    try {
      if (!cache.has(key))
        cache.set(key, await resolveTitle(title))
      const r = cache.get(key)
      if (!r) {
        console.warn(`  ✗ ${id} (${key}): no usable image`)
        continue
      }
      // Keep the source file's real format (some lead images are PNG, not JPEG).
      const ext = (/\.(jpe?g|png|gif|webp)(?:$|\?)/i.exec(r.thumb)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg')
      await download(r.thumb, resolve(IMG_DIR, `${id}.${ext}`))
      entries[id] = {
        imageUrl: `/vehicles/${id}.${ext}`,
        imageCredit: { author: r.author, license: r.license, licenseUrl: r.licenseUrl, sourceUrl: r.sourceUrl },
      }
      console.log(`  ✓ ${id} ← ${title} (${r.license})`)
    }
    catch (err) {
      console.warn(`  ✗ ${id} (${title}): ${err.message}`)
    }
  }

  const body = `// GENERATED by scripts/fetch-vehicle-images.mjs — do not edit by hand.\n`
    + `// CC-licensed vehicle photos from Wikimedia Commons (self-hosted under apps/web/public/vehicles).\n`
    + `import type { VehicleImageCredit } from '../types'\n\n`
    + `export const VEHICLE_IMAGES: Record<string, { imageUrl: string, imageCredit: VehicleImageCredit }> = ${JSON.stringify(entries, null, 2)}\n`
  await writeFile(OUT_TS, body)
  console.log(`\nWrote ${Object.keys(entries).length} entries → ${OUT_TS}`)
}

main()
