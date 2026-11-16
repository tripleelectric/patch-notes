import type { PublishedEntry } from '@patch-notes/schema'
import { describe, expect, it } from 'vitest'
import { login, post, testApp } from './test-utils.js'

const TOKEN = 'g'.repeat(40)
const entry = (id: string, version: string | null = null, type = 'feature', date = '2026-11-14'): PublishedEntry => ({
  path: `${version ? `v${version}` : 'unreleased'}/${id}.md`,
  version,
  data: { id, title: `Title ${id}`, type, date },
  body: `Body ${id}`,
  media: [],
})

async function setup(language: 'en' | 'de', entries: PublishedEntry[], releases: Array<{ version: string; date: string }> = []) {
  const app = await testApp({ publishToken: TOKEN, language })
  const publish = (payload: object) =>
    app.inject({ method: 'POST', url: '/api/publish', payload, headers: { authorization: `Bearer ${TOKEN}` } })
  const response = await publish({ entries, releases })
  if (response.statusCode !== 200) throw new Error(response.body)
  return { app, publish, cookie: await login(app) }
}

describe('interface language', () => {
  it('renders German labels and dates', async () => {
    const { app, cookie } = await setup('de', [entry('a')])
    expect((await app.inject('/login')).body).toContain('Anmelden')
    const body = (await app.inject({ url: '/releases/unreleased', headers: { cookie } })).body
    expect(body).toContain('<html lang="de">')
    expect(body).toContain('Wartet auf Review')
    expect(body).toContain('14.11.2026')
    expect(body).toContain('Noch nicht veröffentlicht')
    const review = await post(app, '/entries/a/review', { action: 'request-changes', body: '' }, cookie, { 'hx-request': 'true' })
    expect(review.body).toContain('Beschreibe, welche Änderungen du brauchst.')
    await app.prisma.entry.update({ where: { id: 'a' }, data: { status: 'accepted' } })
    expect((await app.inject({ url: '/releases/unreleased', headers: { cookie } })).body).toContain('Akzeptiert')
  })

  it('uses English by default', async () => {
    const { app, cookie } = await setup('en', [entry('a')])
    const body = (await app.inject({ url: '/releases/unreleased', headers: { cookie } })).body
    expect(body).toContain('Awaiting review')
    expect(body).toContain('Nov 14, 2026')
  })

  it('translates the German login error', async () => {
    const app = await testApp({ language: 'de' })
    expect((await post(app, '/login', { email: 'x@example.com', password: 'nope-nope-nope' })).body).toContain('E-Mail oder Passwort ist falsch')
  })
})

describe('release dates', () => {
  it('shows the published date, falls back to the newest entry date', async () => {
    const { app, cookie } = await setup(
      'de',
      [entry('a', '1.0.0', 'feature', '2026-10-01'), entry('b', '1.1.0', 'feature', '2026-11-02'), entry('c', '1.1.0', 'fix', '2026-11-06')],
      [{ version: '1.0.0', date: '2026-10-15' }],
    )
    const v100 = (await app.inject({ url: '/releases/1.0.0', headers: { cookie } })).body
    expect(v100).toContain('Veröffentlicht am 15.10.2026')
    const v110 = (await app.inject({ url: '/releases/1.1.0', headers: { cookie } })).body
    expect(v110).toContain('Veröffentlicht am 06.11.2026')
    expect(v110).toContain('15.10.2026')
  })

  it('replaces stored dates on publish and rejects duplicates', async () => {
    const { app, publish } = await setup('en', [entry('a', '1.0.0')], [{ version: '1.0.0', date: '2026-10-15' }])
    expect(await app.prisma.release.findMany()).toEqual([{ version: '1.0.0', date: '2026-10-15' }])
    await publish({ entries: [entry('a', '1.0.0')] })
    expect(await app.prisma.release.count()).toBe(0)
    const twice = await publish({ entries: [entry('a', '1.0.0')], releases: [{ version: '1.0.0', date: '2026-10-15' }, { version: '1.0.0', date: '2026-10-16' }] })
    expect(twice.statusCode).toBe(400)
    expect((await publish({ entries: [], releases: [{ version: '1.0.0', date: '2026-02-30' }] })).statusCode).toBe(400)
  })
})

describe('position numbers', () => {
  it('numbers entries in release order and keeps numbers when filtered', async () => {
    const { app, cookie } = await setup('en', [entry('fix-one', null, 'fix'), entry('feature-one')])
    await app.prisma.entry.update({ where: { id: 'feature-one' }, data: { status: 'accepted' } })
    const body = (await app.inject({ url: '/releases/unreleased', headers: { cookie } })).body
    expect(body).toMatch(/id="entry-feature-one"[\s\S]*?>1<\/span>/)
    expect(body).toMatch(/id="entry-fix-one"[\s\S]*?>2<\/span>/)
    expect(body).toMatch(/>2\.<\/span>[\s\S]*?Title fix-one/)
    const filtered = (await app.inject({ url: '/releases/unreleased?status=awaiting-review', headers: { cookie } })).body
    expect(filtered).not.toContain('id="entry-feature-one"')
    expect(filtered).toMatch(/id="entry-fix-one"[\s\S]*?>2<\/span>/)
  })

  it('keeps the number in htmx review fragments', async () => {
    const { app, cookie } = await setup('en', [entry('fix-one', null, 'fix'), entry('feature-one')])
    const response = await post(app, '/entries/fix-one/review', { action: 'accept', body: '' }, cookie, { 'hx-request': 'true' })
    expect(response.body).toMatch(/>2<\/span>/)
  })
})
