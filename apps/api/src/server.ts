import type { Context } from 'hono'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { injectSocialMeta, originFromRequest, resolveCompareMeta } from './meta'
import { api } from './routes/api'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET'] }))

app.route('/api', api)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webDist = path.resolve(__dirname, '../../web/dist')

if (existsSync(webDist)) {
  const indexPath = path.join(webDist, 'index.html')

  const serveIndexWithMeta = async (c: Context): Promise<Response> => {
    const { readFile } = await import('node:fs/promises')
    const html = await readFile(indexPath, 'utf8')
    const origin = originFromRequest(c.req.url, c.req.raw.headers)
    const meta = resolveCompareMeta(new URL(c.req.url).pathname, origin)
    return c.html(injectSocialMeta(html, meta))
  }

  // Per-comparison crawler meta: inject before static serving so non-JS
  // unfurlers (Facebook, LinkedIn, Twitter) see the real comparison.
  app.get('/', serveIndexWithMeta)
  app.get('/compare/:slug', serveIndexWithMeta)

  app.use(
    '/*',
    serveStatic({
      root: path.relative(process.cwd(), webDist) || '.',
      rewriteRequestPath: p => (p === '/' ? '/index.html' : p),
    }),
  )
  app.notFound(serveIndexWithMeta)
}
else {
  app.get('/', c => c.text('@cts/api running. Web dist not found — run `pnpm dev:web` in another terminal.'))
}

const port = Number(process.env.PORT) || 5174
serve({ fetch: app.fetch, port }, (info) => {
  console.info(`[api] listening on http://localhost:${info.port}`)
})
