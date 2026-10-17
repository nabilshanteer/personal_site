import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/* Vercel runs the files in api/ for you in production. The dev server
   does not, so without this the assistant and the notes page only work
   once deployed — a miserable way to build either of them. This mounts
   the same handlers on the same paths locally, with a small shim for the
   request and response shapes Vercel passes them.
 *
 * The key is read from the environment here exactly as it is in
 * production: put it in .env.local as AI_API_KEY, NOT as VITE_AI_API_KEY
 * — anything prefixed VITE_ is compiled into the bundle and served to
 * every visitor. */
const ROUTES = ['ask', 'knowledge', 'contact']

function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const route of ROUTES) {
        server.middlewares.use(`/api/${route}`, async (req, res, next) => {
          if (req.method !== 'POST') return next()

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          let body = {}
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          } catch {
            body = {}
          }

          const shim = {
            status(code) {
              res.statusCode = code
              return shim
            },
            json(payload) {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(payload))
            },
          }

          try {
            const { default: handler } = await server.ssrLoadModule(`/api/${route}.js`)
            /* Headers and the socket come along because the handlers
               read them — the rate limiter needs to know who is calling,
               and without these every local request looks like the same
               anonymous caller. */
            await handler({ method: 'POST', body, headers: req.headers, socket: req.socket }, shim)
          } catch (error) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: String(error?.message || error) }))
          }
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  /* Vite only puts VITE_-prefixed variables on import.meta.env, and it
     does not touch process.env at all. The handlers in api/ read
     process.env, exactly as they will on Vercel — so the unprefixed
     values are loaded here and put where they expect to find them.
     Loading with an empty prefix picks up AI_API_KEY; nothing from this
     reaches the browser, which is the whole point of the prefix rule. */
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = value
  }

  return { plugins: [react(), devApi()] }
})
