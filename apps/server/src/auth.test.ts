import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { ADMIN, BASE_URL, login, post, testApp, testConfig } from './test-utils.js'

describe('login', () => {
  it('logs in and redirects to next', async () => {
    const app = await testApp()
    const response = await post(app, '/login', { ...ADMIN, next: '/admin/users' })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/admin/users')
    expect(String(response.headers['set-cookie'])).toMatch(/HttpOnly/i)
  })

  it.each([
    ['wrong password', ADMIN.email, 'wrong-password-1'],
    ['unknown email', 'nobody@example.com', ADMIN.password],
  ])('shows a generic error for %s', async (_, email, password) => {
    const response = await post(await testApp(), '/login', { email, password })
    expect(response.statusCode).toBe(401)
    expect(response.body).toContain('Invalid email or password')
  })

  it.each(['//evil.example.com', 'https://evil.example.com', '/\\evil.example.com'])('ignores next=%s', async (next) => {
    const response = await post(await testApp(), '/login', { ...ADMIN, next })
    expect(response.headers.location).toBe('/')
  })

  it('logs out', async () => {
    const app = await testApp()
    const cookie = await login(app)
    expect((await post(app, '/logout', {}, cookie)).headers.location).toBe('/login')
    expect((await app.inject({ url: '/', headers: { cookie } })).statusCode).toBe(303)
  })
})

describe('protection', () => {
  it('redirects anonymous page requests to login', async () => {
    const response = await (await testApp()).inject('/admin/users')
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/login?next=%2Fadmin%2Fusers')
  })

  it('answers anonymous htmx requests with 401', async () => {
    const response = await (await testApp()).inject({ url: '/', headers: { 'hx-request': 'true' } })
    expect(response.statusCode).toBe(401)
  })

  it.each(['/login', '/healthz', '/assets/app.css'])('keeps %s public', async (url) => {
    expect((await (await testApp()).inject(url)).statusCode).toBe(200)
  })

  it('rejects cross-origin form posts', async () => {
    const app = await testApp()
    const cookie = await login(app)
    const response = await post(app, '/logout', {}, cookie, { origin: 'https://evil.example.com' })
    expect(response.statusCode).toBe(403)
    expect((await app.inject({ url: '/', headers: { cookie } })).statusCode).toBe(200)
  })

  it('accepts a same-origin referer without origin', async () => {
    const app = await testApp()
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: new URLSearchParams(ADMIN).toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded', referer: `${BASE_URL}/login` },
    })
    expect(response.statusCode).toBe(303)
  })

  it('rate limits login', async () => {
    const app = await testApp()
    const codes = []
    for (let i = 0; i < 11; i++) codes.push((await post(app, '/login', { email: 'x@example.com', password: 'nope-nope-nope' })).statusCode)
    expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true)
    expect(codes[10]).toBe(429)
  })
})

describe('secret and bootstrap', () => {
  it('keeps sessions valid across restarts with a generated secret', async () => {
    const config = await testConfig()
    const first = await buildApp(config)
    const cookie = await login(first)
    await first.close()
    expect((await stat(join(config.dataDir, 'auth-secret'))).mode & 0o777).toBe(0o600)

    const second = await buildApp(config)
    expect((await second.inject({ url: '/', headers: { cookie } })).statusCode).toBe(200)
    await second.close()
  })

  it('bootstraps the first admin only once', async () => {
    const config = await testConfig()
    await (await buildApp(config)).close()
    const app = await buildApp({ ...config, adminPassword: 'another-password' })
    expect((await post(app, '/login', { ...ADMIN })).statusCode).toBe(303)
    expect((await post(app, '/login', { email: ADMIN.email, password: 'another-password' })).statusCode).toBe(401)
    expect(await app.prisma.user.findMany({ select: { email: true, role: true } })).toEqual([{ email: ADMIN.email, role: 'admin' }])
    await app.close()
  })

  it('starts without users when no admin is configured', async () => {
    const app = await testApp({ adminEmail: undefined, adminPassword: undefined })
    expect(await app.prisma.user.count()).toBe(0)
  })
})
