import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { api } from './routes/api'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET'] }))

app.route('/api', api)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webDist = path.resolve(__dirname, '../../web/dist')

if (existsSync(webDist)) {
  app.use(
    '/*',
    serveStatic({
      root: path.relative(process.cwd(), webDist) || '.',
      rewriteRequestPath: p => (p === '/' ? '/index.html' : p),
    }),
  )
  app.notFound(async (c) => {
    const indexPath = path.join(webDist, 'index.html')
    const { readFile } = await import('node:fs/promises')
    const html = await readFile(indexPath, 'utf8')
    return c.html(html)
  })
}
else {
  app.get('/', c => c.text('@cts/api running. Web dist not found — run `pnpm dev:web` in another terminal.'))
}

const port = Number(process.env.PORT) || 5174
serve({ fetch: app.fetch, port }, (info) => {
  console.info(`[api] listening on http://localhost:${info.port}`)
})
