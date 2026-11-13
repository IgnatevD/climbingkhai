import path from 'node:path'
import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Серверні функції Netlify під час `npm run dev`: /api/admin/*, /api/game/* та /api/instagram
 * працюють локально без Netlify CLI. Сховище Blobs замінено файлами в .netlify/dev-blobs/.
 * Логін/пароль адмінки беруться з .env.local (ADMIN_LOGIN, ADMIN_PASSWORD), інакше — admin / admin.
 */
function netlifyFunctionsDev(env: Record<string, string>): Plugin {
  const routes: [RegExp, string][] = [
    [/^\/api\/admin(\/|$)/, '/netlify/functions/admin.mts'],
    [/^\/api\/instagram(\?|$)/, '/netlify/functions/instagram.mts'],
    [/^\/api\/game(\/|$)/, '/netlify/functions/game.mts'],
  ]
  const usingDefaults = !env.ADMIN_USERS && !(env.ADMIN_LOGIN && env.ADMIN_PASSWORD)
  const vars: Record<string, string> = {
    // Локальний суперадмін (резервний вхід) — на Netlify задається змінними SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD
    SUPERADMIN_LOGIN: 'superadmin',
    SUPERADMIN_PASSWORD: 'superadmin1985',
    ...env,
    ...(usingDefaults ? { ADMIN_LOGIN: 'admin', ADMIN_PASSWORD: 'admin' } : {}),
  }

  const readBody = async (req: IncomingMessage) => {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    return Buffer.concat(chunks)
  }

  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      ;(globalThis as Record<string, unknown>).Netlify = { env: { get: (k: string) => vars[k] ?? process.env[k] } }
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          server.config.logger.info(
            usingDefaults
              ? `\n  🧗 Адмінка: /admin  (вхід: admin / admin, суперадмін: ${vars.SUPERADMIN_LOGIN} / ${vars.SUPERADMIN_PASSWORD})\n`
              : '\n  🧗 Адмінка: /admin  (логін і пароль з .env.local)\n',
          )
        }, 50)
      })

      server.middlewares.use(async (req, res, next) => {
        const route = routes.find(([re]) => re.test(req.url ?? ''))
        if (!route) return next()
        try {
          const mod = await server.ssrLoadModule(route[1])
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
          const method = req.method ?? 'GET'
          const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
          const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, { method, headers, body })
          const response: Response = await mod.default(request, { ip: req.socket.remoteAddress ?? '127.0.0.1' })
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            // Локально сайт відкривається по http — прибираємо Secure, щоб Safari прийняв cookie
            res.setHeader(key, key === 'set-cookie' ? value.replace(/;\s*Secure/i, '') : value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          server.config.logger.error(`[netlify-functions-dev] ${route[1]}: ${e instanceof Error ? e.stack : e}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: `Локальна функція впала: ${e instanceof Error ? e.message : e}` }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), netlifyFunctionsDev(env)],
    resolve:
      command === 'serve'
        ? { alias: { '@netlify/blobs': path.resolve('scripts/dev-blobs.mjs') } }
        : undefined,
  }
})
