import { describe, expect, it } from 'vitest'
import { addUser, ADMIN, invite, login, post, testApp } from './test-utils.js'

describe('roles', () => {
  it('forbids reviewers on admin pages', async () => {
    const app = await testApp()
    const { cookie } = await addUser(app, await login(app), 'pat@example.com')
    expect((await app.inject({ url: '/admin/users', headers: { cookie } })).statusCode).toBe(403)
    expect((await post(app, '/admin/invites', { email: 'x@example.com', role: 'admin' }, cookie)).statusCode).toBe(403)
  })
})

describe('invites', () => {
  it('shows the link once and lists the invite as pending', async () => {
    const app = await testApp()
    const cookie = await login(app)
    const response = await post(app, '/admin/invites', { email: 'PM@example.com', role: 'reviewer' }, cookie)
    expect(response.body).toMatch(/value="http:\/\/localhost:3000\/invite\/[A-Za-z0-9_-]{43}"/)
    const page = await app.inject({ url: '/admin/users', headers: { cookie } })
    expect(page.body).toContain('pm@example.com')
    expect(page.body).not.toContain('/invite/')
  })

  it('rejects an invite for an existing user', async () => {
    const app = await testApp()
    const response = await post(app, '/admin/invites', { email: ADMIN.email, role: 'reviewer' }, await login(app))
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain('already exists')
  })

  it('replaces a pending invite for the same email', async () => {
    const app = await testApp()
    const cookie = await login(app)
    const old = await invite(app, cookie, 'pm@example.com')
    await invite(app, cookie, 'pm@example.com', 'admin')
    expect((await app.inject(old)).statusCode).toBe(404)
    expect(await app.prisma.invite.findMany({ select: { role: true } })).toEqual([{ role: 'admin' }])
  })

  it('accepts an invite, logs in and consumes the token', async () => {
    const app = await testApp()
    const path = await invite(app, await login(app), 'pat@example.com', 'admin')
    expect((await app.inject(path)).body).toContain('pat@example.com')
    const response = await post(app, path, { name: 'Pat', password: 'twelve-chars', confirm: 'twelve-chars' })
    expect(response.statusCode).toBe(303)
    expect((await app.inject({ url: '/admin/users', headers: { cookie: (await login(app, 'pat@example.com', 'twelve-chars')) } })).statusCode).toBe(200)
    expect(await app.prisma.user.findUnique({ where: { email: 'pat@example.com' }, select: { name: true, role: true } })).toEqual({
      name: 'Pat',
      role: 'admin',
    })
    expect((await app.inject(path)).statusCode).toBe(404)
    expect((await post(app, path, { name: 'Pat', password: 'twelve-chars', confirm: 'twelve-chars' })).statusCode).toBe(404)
  })

  it.each([
    [{ name: 'Pat', password: 'nine-char', confirm: 'nine-char' }, 'at least 10'],
    [{ name: 'Pat', password: 'twelve-chars', confirm: 'twelve-charz' }, 'do not match'],
    [{ name: ' ', password: 'twelve-chars', confirm: 'twelve-chars' }, 'Enter your name'],
  ])('rejects invalid form %j', async (form, message) => {
    const app = await testApp()
    const path = await invite(app, await login(app), 'pat@example.com')
    const response = await post(app, path, form)
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain(message)
    expect(await app.prisma.user.count()).toBe(1)
  })

  it('rejects expired and revoked invites', async () => {
    const app = await testApp()
    const cookie = await login(app)
    const expired = await invite(app, cookie, 'old@example.com')
    await app.prisma.invite.updateMany({ where: { email: 'old@example.com' }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await app.inject(expired)).statusCode).toBe(404)

    const revoked = await invite(app, cookie, 'gone@example.com')
    const { id } = await app.prisma.invite.findFirstOrThrow({ where: { email: 'gone@example.com' } })
    await post(app, `/admin/invites/${id}/revoke`, {}, cookie)
    expect((await app.inject(revoked)).statusCode).toBe(404)
    expect((await app.inject('/invite/unknown-token')).statusCode).toBe(404)
  })
})

describe('manage users', () => {
  it('promotes a reviewer to admin', async () => {
    const app = await testApp()
    const adminCookie = await login(app)
    const { cookie } = await addUser(app, adminCookie, 'pat@example.com')
    const pat = await app.prisma.user.findUniqueOrThrow({ where: { email: 'pat@example.com' } })
    expect((await post(app, `/admin/users/${pat.id}/role`, { role: 'admin' }, adminCookie)).statusCode).toBe(303)
    expect((await app.inject({ url: '/admin/users', headers: { cookie } })).statusCode).toBe(200)
  })

  it('keeps the last admin', async () => {
    const app = await testApp()
    const cookie = await login(app)
    const admin = await app.prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } })
    const response = await post(app, `/admin/users/${admin.id}/role`, { role: 'reviewer' }, cookie)
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain('last admin')
    expect((await app.prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe('admin')
    expect((await post(app, `/admin/users/${admin.id}/remove`, {}, cookie)).body).toContain('cannot remove yourself')
  })

  it('removes a user and ends their session', async () => {
    const app = await testApp()
    const adminCookie = await login(app)
    const { cookie } = await addUser(app, adminCookie, 'pat@example.com')
    const pat = await app.prisma.user.findUniqueOrThrow({ where: { email: 'pat@example.com' } })
    expect((await post(app, `/admin/users/${pat.id}/remove`, {}, adminCookie)).statusCode).toBe(303)
    expect((await app.inject({ url: '/', headers: { cookie } })).statusCode).toBe(303)
  })

  it('escapes user-provided names', async () => {
    const app = await testApp()
    const adminCookie = await login(app)
    await addUser(app, adminCookie, 'x@example.com', 'reviewer', '<script>alert(1)</script>')
    const page = await app.inject({ url: '/admin/users', headers: { cookie: adminCookie } })
    expect(page.body).not.toContain('<script>alert(1)</script>')
    expect(page.body).toContain('&lt;script>alert(1)&lt;/script>')
  })
})
