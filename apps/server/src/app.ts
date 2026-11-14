import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyReply, type FastifyServerOptions } from 'fastify'
import type { Config } from './config.js'
import { createPrisma, migrate, MIGRATIONS_DIR } from './db.js'
import type { PrismaClient } from './generated/prisma/client.js'
import { HomePage } from './views/home.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    prisma: PrismaClient
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

  const app = Fastify({ logger: options.logger ?? false })
  app.decorate('config', config)
  app.decorate('prisma', prisma)
  app.addHook('onClose', () => prisma.$disconnect())

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

  app.get('/', async (_request, reply) => sendHtml(reply, HomePage()))

  return app
}
