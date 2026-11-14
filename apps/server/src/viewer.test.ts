import { createHash } from 'node:crypto'
import type { PublishedEntry } from '@patch-notes/schema'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { addUser, login, post, testApp } from './test-utils.js'

const TOKEN = 'v'.repeat(40)
const PNG = Buffer.from('89504e470d0a1a0a0000', 'hex')
const WEBM = Buffer.from('1a45dfa3' + '00'.repeat(60), 'hex')
const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex')

function entry(id: string, data: Record<string, unknown> = {}, rest: Partial<PublishedEntry> = {}): PublishedEntry {
  return {
    path: `${rest.version ? `v${rest.version}` : 'unreleased'}/${id}.md`,
    version: null,
    data: { id, title: `Title ${id}`, type: 'feature', date: '2026-11-14', ...data },
    body: `Body of ${id}`,
    media: [],
    ...rest,
  }
}

async function setup(entries: PublishedEntry[], appUrl?: string) {
  const app = await testApp({ publishToken: TOKEN })
  const headers = { authorization: `Bearer ${TOKEN}` }
  for (const [data, type] of [[PNG, 'image/png'], [WEBM, 'video/webm']] as const) {
    await app.inject({ method: 'PUT', url: `/api/media/${sha(data)}`, payload: data, headers: { ...headers, 'content-type': type } })
  }
  const response = await app.inject({ method: 'POST', url: '/api/publish', payload: { entries, ...(appUrl && { appUrl }) }, headers })
  if (response.statusCode !== 200) throw new Error(response.body)
  return { app, cookie: await login(app) }
}

const page = (app: FastifyInstance, url: string, cookie: string, headers: Record<string, string> = {}) =>
  app.inject({ url, headers: { cookie, ...headers } })

const setStatus = (app: FastifyInstance, id: string, status: string) => app.prisma.entry.update({ where: { id }, data: { status } })

describe('releases', () => {
  it('redirects / to unreleased, else the highest version', async () => {
    const { app, cookie } = await setup([entry('a'), entry('b', {}, { version: '1.2.0' })])
    expect((await page(app, '/', cookie)).headers.location).toBe('/releases/unreleased')

    const released = await setup([entry('b', {}, { version: '1.2.0' }), entry('c', {}, { version: '1.10.0' })])
    expect((await page(released.app, '/', released.cookie)).headers.location).toBe('/releases/1.10.0')
  })

  it('shows an empty state without entries', async () => {
    const { app, cookie } = await setup([])
    expect((await page(app, '/', cookie)).body).toContain('patchnotes publish')
  })

  it('orders versions numerically in the navigation', async () => {
    const { app, cookie } = await setup(['1.2.0', '1.10.0', '1.9.1'].map((v, i) => entry(`e${i}`, {}, { version: v })))
    const body = (await page(app, '/releases/1.2.0', cookie)).body
    const order = ['v1.10.0', 'v1.9.1', 'v1.2.0'].map((label) => body.indexOf(`>${label}<`))
    expect(order.every((index) => index > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('groups features before fixes and 404s unknown releases', async () => {
    const { app, cookie } = await setup([entry('fix-one', { type: 'fix' }), entry('feature-one')])
    const body = (await page(app, '/releases/unreleased', cookie)).body
    expect(body.indexOf('Title feature-one')).toBeLessThan(body.indexOf('Title fix-one'))
    expect((await page(app, '/releases/9.9.9', cookie)).statusCode).toBe(404)
    expect((await page(app, '/releases/latest', cookie)).statusCode).toBe(404)
  })

  it('shows progress and filters by status', async () => {
    const { app, cookie } = await setup(['a', 'b', 'c', 'd'].map((id) => entry(id)))
    await setStatus(app, 'a', 'accepted')
    await setStatus(app, 'b', 'accepted')
    await setStatus(app, 'c', 'changes-requested')
    const body = (await page(app, '/releases/unreleased', cookie)).body
    expect(body).toContain('2 of 4 accepted')
    expect(body).toContain('1 changes requested')
    expect(body).toContain('1 awaiting review')
    const filtered = (await page(app, '/releases/unreleased?status=awaiting-review', cookie)).body
    expect(filtered).toContain('Title d')
    expect(filtered).not.toContain('Title a<')
  })
})

describe('entry page', () => {
  const media = {
    data: { media: [{ before: 'media/b.png', after: 'media/a.png', caption: 'Export button' }, { video: 'media/v.webm' }] },
    media: [
      { path: 'media/b.png', sha256: sha(PNG), size: PNG.length, contentType: 'image/png' },
      { path: 'media/a.png', sha256: sha(PNG), size: PNG.length, contentType: 'image/png' },
      { path: 'media/v.webm', sha256: sha(WEBM), size: WEBM.length, contentType: 'video/webm' },
    ],
  }

  it('shows media, requests and a try link resolved against appUrl', async () => {
    const { app, cookie } = await setup(
      [entry('a', { ...media.data, requests: ['https://app.asana.com/0/1/2'], try: '/invoices?export=1' }, { media: media.media })],
      'https://app.example.com',
    )
    const body = (await page(app, '/entries/a', cookie)).body
    expect(body).toContain('>Before<')
    expect(body).toContain('>After<')
    expect(body).toContain(`/media/${sha(PNG)}.png`)
    expect(body).toContain(`<video controls`)
    expect(body).toContain('href="https://app.example.com/invoices?export=1"')
    expect(body).toContain('href="https://app.asana.com/0/1/2"')
  })

  it('shows a path try link as text without appUrl', async () => {
    const { app, cookie } = await setup([entry('a', { try: '/invoices' })])
    const body = (await page(app, '/entries/a', cookie)).body
    expect(body).not.toContain('Try it')
    expect(body).toContain('/invoices')
  })

  it('marks removed entries and hides review actions', async () => {
    const { app, cookie } = await setup([entry('a'), entry('b')])
    await app.inject({ method: 'POST', url: '/api/publish', payload: { entries: [entry('b')] }, headers: { authorization: `Bearer ${TOKEN}` } })
    const body = (await page(app, '/entries/a', cookie)).body
    expect(body).toContain('removed from the repository')
    expect(body).not.toContain('value="accept"')
    expect((await post(app, '/entries/a/review', { action: 'accept', body: '' }, cookie)).statusCode).toBe(400)
  })

  it('renders hostile content safely', async () => {
    const { app, cookie } = await setup([
      entry('a', { title: '<script>alert(1)</script>' }, { body: '<script>alert(2)</script>\n\n[x](javascript:alert(3)) [ok](https://example.com)' }),
    ])
    const body = (await page(app, '/entries/a', cookie)).body
    expect(body).not.toMatch(/<script>alert/)
    expect(body).not.toMatch(/href="javascript:/i)
    expect(body).toContain('href="https://example.com"')
  })

  it('404s an unknown entry', async () => {
    const { app, cookie } = await setup([])
    expect((await page(app, '/entries/nope', cookie)).statusCode).toBe(404)
  })
})

describe('media delivery', () => {
  it('requires a session', async () => {
    const { app } = await setup([])
    const response = await app.inject(`/media/${sha(PNG)}.png`)
    expect(response.statusCode).toBe(303)
    expect(response.body).toBe('')
  })

  it('serves files with ranges and private caching', async () => {
    const { app, cookie } = await setup([])
    const full = await page(app, `/media/${sha(PNG)}.png`, cookie)
    expect(full.statusCode).toBe(200)
    expect(full.headers['content-type']).toBe('image/png')
    expect(full.headers['cache-control']).toBe('private, max-age=31536000, immutable')
    const range = await page(app, `/media/${sha(WEBM)}.webm`, cookie, { range: 'bytes=0-9' })
    expect(range.statusCode).toBe(206)
    expect(range.rawPayload.length).toBe(10)
  })

  it.each(['../auth-secret', `${sha(PNG)}.svg`, 'patchnotes.db'])('rejects %s', async (name) => {
    const { app, cookie } = await setup([])
    expect((await page(app, `/media/${encodeURIComponent(name)}`, cookie)).statusCode).toBe(404)
  })
})

describe('review', () => {
  it('accepts as reviewer and records history', async () => {
    const { app, cookie } = await setup([entry('a')])
    const reviewer = await addUser(app, cookie, 'pat@example.com', 'reviewer', 'Pat')
    expect((await post(app, '/entries/a/review', { action: 'accept', body: '' }, reviewer.cookie)).statusCode).toBe(303)
    expect((await app.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).status).toBe('accepted')
    const body = (await page(app, '/entries/a', reviewer.cookie)).body
    expect(body).toMatch(/Pat<\/strong>\s*<span>accepted/)
  })

  it('requires a comment to request changes', async () => {
    const { app, cookie } = await setup([entry('a')])
    const response = await post(app, '/entries/a/review', { action: 'request-changes', body: '  ' }, cookie)
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain('Describe which changes you need')
    expect((await app.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).status).toBe('awaiting-review')
  })

  it('requests changes with a comment, then resets on update', async () => {
    const { app, cookie } = await setup([entry('a')])
    await post(app, '/entries/a/review', { action: 'request-changes', body: 'Export button is hard to find\nsecond line' }, cookie)
    expect((await app.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).status).toBe('changes-requested')
    await app.inject({
      method: 'POST',
      url: '/api/publish',
      payload: { entries: [{ ...entry('a'), body: 'New body' }] },
      headers: { authorization: `Bearer ${TOKEN}` },
    })
    const body = (await page(app, '/entries/a', cookie)).body
    expect(body).toContain('Export button is hard to find\nsecond line')
    expect(body.indexOf('requested changes')).toBeLessThan(body.indexOf('updated the entry'))
    expect((await app.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).status).toBe('awaiting-review')
  })

  it('comments without changing status and escapes the text', async () => {
    const { app, cookie } = await setup([entry('a')])
    await post(app, '/entries/a/review', { action: 'comment', body: '<b>Looks good</b>, waiting for PO' }, cookie)
    expect((await app.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).status).toBe('awaiting-review')
    expect((await page(app, '/entries/a', cookie)).body).toContain('&lt;b>Looks good&lt;/b>, waiting for PO')
    expect((await post(app, '/entries/a/review', { action: 'comment', body: 'x'.repeat(5001) }, cookie)).statusCode).toBe(400)
  })

  it('links the next entry awaiting review, wrapping around', async () => {
    const { app, cookie } = await setup(['a', 'b', 'c'].map((id) => entry(id)))
    expect((await page(app, '/entries/b', cookie)).body).toContain('href="/entries/c"')
    expect((await page(app, '/entries/c', cookie)).body).toContain('href="/entries/a"')
    await setStatus(app, 'a', 'accepted')
    await setStatus(app, 'c', 'accepted')
    expect((await page(app, '/entries/b', cookie)).body).toContain('Nothing else awaits review')
  })
})
