import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins/admin'
import type { Config } from './config.js'
import type { PrismaClient } from './generated/prisma/client.js'

export const ROLES = ['admin', 'reviewer'] as const
export type Role = (typeof ROLES)[number]
export const MIN_PASSWORD = 10

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
}

/** `AUTH_SECRET`, or a random secret generated once and kept in the data directory. */
export function loadSecret(config: Config): string {
  if (config.authSecret) return config.authSecret
  const file = join(config.dataDir, 'auth-secret')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  const secret = randomBytes(32).toString('base64url')
  writeFileSync(file, secret, { mode: 0o600, flag: 'wx' })
  return secret
}

export function createAuth(prisma: PrismaClient, config: Config) {
  return betterAuth({
    baseURL: config.baseUrl,
    secret: loadSecret(config),
    database: prismaAdapter(prisma, { provider: 'sqlite' }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: MIN_PASSWORD, maxPasswordLength: 128 },
    plugins: [admin({ defaultRole: 'reviewer', adminRoles: ['admin'] })],
    trustedOrigins: [config.baseUrl],
    // Login attempts are limited by our own routes; Better Auth's HTTP endpoints are not mounted.
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
  })
}

export type Auth = ReturnType<typeof createAuth>

export async function createUser(auth: Auth, user: { email: string; password: string; name: string; role: Role }) {
  // The admin plugin types roles as its defaults ('user' | 'admin'); our roles are plain strings in the same column.
  return auth.api.createUser({ body: { ...user, role: user.role as 'admin' } })
}

export async function bootstrapAdmin(auth: Auth, prisma: PrismaClient, config: Config): Promise<'created' | 'skipped' | 'missing'> {
  if ((await prisma.user.count()) > 0) return 'skipped'
  if (!config.adminEmail || !config.adminPassword) return 'missing'
  await createUser(auth, { email: config.adminEmail, password: config.adminPassword, name: config.adminEmail.split('@')[0]!, role: 'admin' })
  return 'created'
}
