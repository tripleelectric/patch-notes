import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { onTestFinished } from 'vitest'
import { buildApp, type AppOptions } from './app.js'
import type { Config } from './config.js'

export const BASE_URL = 'http://localhost:3000'
export const ADMIN = { email: 'admin@example.com', password: 'admin-password-1' }

export async function tmpDir(): Promise<string> {
  const dir = await mkdtemp(join(await realpath(tmpdir()), 'patchnotes-server-'))
  onTestFinished(() => rm(dir, { recursive: true, force: true }))
  return dir
}

export async function testConfig(overrides: Partial<Config> = {}): Promise<Config> {
  return {
    dataDir: await tmpDir(),
    port: 0,
    host: '127.0.0.1',
    baseUrl: BASE_URL,
    language: 'en',
    adminEmail: ADMIN.email,
    adminPassword: ADMIN.password,
    ...overrides,
  }
}

export async function testApp(overrides: Partial<Config> = {}, options: AppOptions = {}) {
  const app = await buildApp(await testConfig(overrides), options)
  onTestFinished(() => app.close())
  return app
}

/** Form post as a same-origin browser would send it. */
export function post(app: FastifyInstance, url: string, form: Record<string, string> = {}, cookie?: string, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'POST',
    url,
    payload: new URLSearchParams(form).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE_URL, ...(cookie && { cookie }), ...headers },
  })
}

export function cookieOf(response: { headers: Record<string, unknown> }): string {
  const raw = [response.headers['set-cookie'] ?? []].flat() as string[]
  return raw.map((c) => c.split(';')[0]).join('; ')
}

export async function login(app: FastifyInstance, email = ADMIN.email, password = ADMIN.password): Promise<string> {
  const response = await post(app, '/login', { email, password })
  if (response.statusCode !== 303) throw new Error(`login failed: ${response.statusCode}`)
  return cookieOf(response)
}

/** Creates an invite as admin and returns its path `/invite/<token>`. */
export async function invite(app: FastifyInstance, adminCookie: string, email: string, role = 'reviewer'): Promise<string> {
  const response = await post(app, '/admin/invites', { email, role }, adminCookie)
  const link = /value="(http[^"]+\/invite\/[^"]+)"/.exec(response.body)?.[1]
  if (!link) throw new Error(`no invite link: ${response.statusCode}`)
  return new URL(link).pathname
}

export async function addUser(app: FastifyInstance, adminCookie: string, email: string, role = 'reviewer', name = 'Pat') {
  const path = await invite(app, adminCookie, email, role)
  const password = 'reviewer-password'
  const response = await post(app, path, { name, password, confirm: password })
  if (response.statusCode !== 303) throw new Error(`accept failed: ${response.statusCode}`)
  return { cookie: cookieOf(response), password }
}
