import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import formbody from '@fastify/formbody'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyReply, type FastifyServerOptions } from 'fastify'
import { bootstrapAdmin, createAuth, type Auth, type SessionUser } from './auth.js'
import type { Config } from './config.js'
import { createPrisma, migrate, MIGRATIONS_DIR } from './db.js'
import type { PrismaClient } from './generated/prisma/client.js'
import { isHtmx, toHeaders } from './http.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { inviteRoutes } from './routes/invite.js'
import { HomePage } from './views/home.js'
import { MessagePage } from './views/auth.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    prisma: PrismaClient
    auth: Auth
  }
  interface FastifyRequest {
    user: SessionUser | null
  }
}

/** Paths reachable without a session; entries ending in `/` are prefixes. */
const PUBLIC_PATHS = ['/login', '/invite/', '/healthz', '/assets/', '/api/']
const isPublic = (path: string) => PUBLIC_PATHS.some((p) => (p.endsWith('/') ? path.startsWith(p) : path === p))
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function requestOrigin(headers: { origin?: string | undefined; referer?: string | undefined }): string | undefined {
  if (headers.origin) return headers.origin
  try {
    return headers.referer ? new URL(headers.referer).origin : undefined
  } catch {
    return undefined
  }
}

export const PUBLIC_DIR = new URL('../public', import.meta.url).pathname

const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "media-src 'self'",
  "style-src 'self'",
  "script-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export interface AppOptions {
  logger?: FastifyServerOptions['logger']
  migrationsDir?: string
}

export async function sendHtml(reply: FastifyReply, html: JSX.Element, status = 200) {
  return reply.status(status).type('text/html; charset=utf-8').send(`<!doctype html>${await html}`)
}

export async function buildApp(config: Config, options: AppOptions = {}) {
  mkdirSync(config.dataDir, { recursive: true })
  const dbPath = join(config.dataDir, 'patchnotes.db')
  migrate(dbPath, options.migrationsDir ?? MIGRATIONS_DIR)
  const prisma = createPrisma(dbPath)

  const auth = createAuth(prisma, config)

  const app = Fastify({ logger: options.logger ?? false })
  app.decorate('config', config)
  app.decorate('prisma', prisma)
  app.decorate('auth', auth)
  app.decorateRequest('user', null)
  app.addHook('onClose', () => prisma.$disconnect())

  const bootstrap = await bootstrapAdmin(auth, prisma, config)
  if (bootstrap === 'created') app.log.info(`created admin ${config.adminEmail}`)
  if (bootstrap === 'missing') app.log.warn('no users yet: set ADMIN_EMAIL and ADMIN_PASSWORD and restart to create the first admin')

  const appOrigin = new URL(config.baseUrl).origin
  app.addHook('onRequest', async (request, reply) => {
    if (SAFE_METHODS.has(request.method) || request.url.startsWith('/api/')) return
    if (requestOrigin(request.headers) !== appOrigin) return reply.status(403).send('Cross-origin request rejected')
  })

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!
    if (isPublic(path)) return
    const session = await auth.api.getSession({ headers: toHeaders(request.headers) })
    if (!session) {
      if (isHtmx(request)) return reply.status(401).send()
      return reply.redirect(`/login?next=${encodeURIComponent(request.url)}`, 303)
    }
    const { id, name, email, role } = session.user
    request.user = { id, name, email, role: role === 'admin' ? 'admin' : 'reviewer' }
    if (path.startsWith('/admin/') && request.user.role !== 'admin') {
      return sendHtml(reply, MessagePage({ title: 'Not allowed', message: 'Only admins can open this page.' }), 403)
    }
  })

  await app.register(formbody)
  await app.register(rateLimit, { global: false })

  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    if (String(reply.getHeader('content-type') ?? '').startsWith('text/html')) {
      reply.header('Content-Security-Policy', CSP)
      reply.header('Referrer-Policy', 'same-origin')
    }
  })

  await app.register(fastifyStatic, {
    root: join(PUBLIC_DIR, 'assets'),
    prefix: '/assets/',
    maxAge: '1h',
  })

  app.get('/healthz', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ok' }
    } catch {
      return reply.status(503).send({ status: 'unavailable' })
    }
  })

  authRoutes(app)
  inviteRoutes(app)
  adminRoutes(app)
  app.get('/', async (request, reply) => sendHtml(reply, HomePage({ user: request.user! })))

  return app
}
