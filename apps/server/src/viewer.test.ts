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

describe('timeline', () => {
  it('shows all releases, unreleased first, then versions numerically', async () => {
    const { app, cookie } = await setup(['1.2.0', '1.10.0', '1.9.1'].map((v, i) => entry(`e${i}`, {}, { version: v })).concat(entry('u')))
    const body = (await page(app, '/', cookie)).body
    const order = ['release-unreleased', 'release-1.10.0', 'release-1.9.1', 'release-1.2.0'].map((id) => body.indexOf(`id="${id}"`))
    expect(order.every((index) => index > 0)).toBe(true)
    expect([...order].sort((x, y) => x - y)).toEqual(order)
  })

  it('shows an empty state without entries', async () => {
    const { app, cookie } = await setup([])
    expect((await page(app, '/', cookie)).body).toContain('patchnotes publish')
  })

  it('collapses entries by default and orders features before fixes', async () => {
    const { app, cookie } = await setup([entry('fix-one', { type: 'fix' }), entry('feature-one')])
    const body = (await page(app, '/', cookie)).body
    expect(body).toMatch(/<details id="entry-feature-one"/)
    expect(body).not.toMatch(/<details open[^>]*id="entry-/)
    expect(body.indexOf('Title feature-one')).toBeLessThan(body.indexOf('Title fix-one'))
  })

  it('redirects release links to their section and 404s unknown releases', async () => {
    const { app, cookie } = await setup([entry('a'), entry('b', {}, { version: '1.1.0' })])
    expect((await page(app, '/releases/1.1.0', cookie)).headers.location).toBe('/#release-1.1.0')
    expect((await page(app, '/releases/unreleased', cookie)).headers.location).toBe('/#release-unreleased')
    expect((await page(app, '/releases/9.9.9', cookie)).statusCode).toBe(404)
    expect((await page(app, '/releases/latest', cookie)).statusCode).toBe(404)
  })

  it('shows open change requests on the rail and filters by them', async () => {
    const { app, cookie } = await setup(['a', 'b', 'c'].map((id) => entry(id)))
    expect((await page(app, '/', cookie)).body).not.toContain('open change request')
    await setStatus(app, 'c', 'changes-requested')
    const body = (await page(app, '/', cookie)).body
    expect(body).toContain('1 open change request')
    const filtered = (await page(app, '/?show=changes-requested', cookie)).body
    expect(filtered).toContain('id="entry-c"')
    expect(filtered).not.toContain('id="entry-a"')
  })

  it('filters by type and hides releases without matches', async () => {
    const { app, cookie } = await setup([entry('a'), entry('f', { type: 'fix' }, { version: '1.0.0' })])
    const body = (await page(app, '/?show=fix', cookie)).body
    expect(body).toContain('id="entry-f"')
    expect(body).not.toContain('id="entry-a"')
    expect(body).not.toContain('id="release-unreleased"')
  })
})

describe('entry rows', () => {
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
    const body = (await page(app, '/', cookie)).body
    expect(body).toContain('id="entry-a"')
    expect(body).toContain('Body of a')
    expect(body).toContain('>Before<')
    expect(body).toContain('>After<')
    expect(body).toContain(`/media/${sha(PNG)}.png`)
    expect(body).toContain(`<video controls`)
    expect(body).toContain('href="https://app.example.com/invoices?export=1"')
    expect(body).toContain('href="https://app.asana.com/0/1/2"')
  })

  it('shows a path try link as text without appUrl', async () => {
    const { app, cookie } = await setup([entry('a', { try: '/invoices' })])
    const body = (await page(app, '/', cookie)).body
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

  it('marks entries with changes requested in their row', async () => {
    const { app, cookie } = await setup([entry('a'), entry('b', { type: 'fix' })])
    await setStatus(app, 'b', 'changes-requested')
    const body = (await page(app, '/', cookie)).body
    expect(body).toContain('Body of a')
    expect(body).toContain('Body of b')
    expect(body).toMatch(/id="entry-b"[\s\S]*?Changes requested/)
  })

  it('redirects the permalink to the entry anchor', async () => {
    const { app, cookie } = await setup([entry('a'), entry('b', {}, { version: '1.0.0' })])
    expect((await page(app, '/entries/a', cookie)).headers.location).toBe('/#entry-a')
    expect((await page(app, '/entries/b', cookie)).headers.location).toBe('/#entry-b')
  })

  it('renders hostile content safely', async () => {
    const { app, cookie } = await setup([
      entry('a', { title: '<script>alert(1)</script>' }, { body: '<script>alert(2)</script>\n\n[x](javascript:alert(3)) [ok](https://example.com)' }),
    ])
    const body = (await page(app, '/', cookie)).body
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
  const statusOf = async (app: FastifyInstance, id: string) => (await app.prisma.entry.findUniqueOrThrow({ where: { id } })).status

  it('starts entries open without any accept action', async () => {
    const { app, cookie } = await setup([entry('a')])
    expect(await statusOf(app, 'a')).toBe('open')
    const body = (await page(app, '/', cookie)).body
    expect(body).not.toContain('value="accept"')
    expect(body).not.toContain('value="resolve"')
    expect((await post(app, '/entries/a/review', { action: 'accept', body: '' }, cookie)).statusCode).toBe(400)
  })

  it('requires a comment to request changes', async () => {
    const { app, cookie } = await setup([entry('a')])
    const response = await post(app, '/entries/a/review', { action: 'request-changes', body: '  ' }, cookie)
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain('Describe which changes you need')
    expect(await statusOf(app, 'a')).toBe('open')
  })

  it('requests changes as reviewer, then clears them on update', async () => {
    const { app, cookie } = await setup([entry('a')])
    const reviewer = await addUser(app, cookie, 'pat@example.com', 'reviewer', 'Pat')
    await post(app, '/entries/a/review', { action: 'request-changes', body: 'Export button is hard to find\nsecond line' }, reviewer.cookie)
    expect(await statusOf(app, 'a')).toBe('changes-requested')
    expect((await page(app, '/', cookie)).body).toMatch(/Pat<\/strong>\s*<span>requested changes/)
    await app.inject({
      method: 'POST',
      url: '/api/publish',
      payload: { entries: [{ ...entry('a'), body: 'New body' }] },
      headers: { authorization: `Bearer ${TOKEN}` },
    })
    const body = (await page(app, '/', cookie)).body
    expect(body).toContain('Export button is hard to find\nsecond line')
    expect(body.indexOf('requested changes')).toBeLessThan(body.indexOf('updated the entry'))
    expect(await statusOf(app, 'a')).toBe('open')
  })

  it('resolves a change request, and ignores resolve otherwise', async () => {
    const { app, cookie } = await setup([entry('a')])
    await post(app, '/entries/a/review', { action: 'resolve', body: '' }, cookie)
    expect(await app.prisma.reviewEvent.count()).toBe(0)
    await post(app, '/entries/a/review', { action: 'request-changes', body: 'Typo in title' }, cookie)
    expect((await page(app, '/', cookie)).body).toContain('value="resolve"')
    await post(app, '/entries/a/review', { action: 'resolve', body: '' }, cookie)
    expect(await statusOf(app, 'a')).toBe('open')
    expect((await page(app, '/', cookie)).body).toContain('marked the change request as resolved')
  })

  it('comments without changing status and escapes the text', async () => {
    const { app, cookie } = await setup([entry('a')])
    await post(app, '/entries/a/review', { action: 'comment', body: '<b>Looks good</b>, waiting for PO' }, cookie)
    expect(await statusOf(app, 'a')).toBe('open')
    expect((await page(app, '/', cookie)).body).toContain('&lt;b>Looks good&lt;/b>, waiting for PO')
    expect((await post(app, '/entries/a/review', { action: 'comment', body: 'x'.repeat(5001) }, cookie)).statusCode).toBe(400)
  })

  it('redirects plain form reviews to the entry anchor', async () => {
    const { app, cookie } = await setup([entry('a')])
    expect((await post(app, '/entries/a/review', { action: 'comment', body: 'Nice' }, cookie)).headers.location).toBe('/#entry-a')
  })

  it('answers htmx reviews with the updated section only', async () => {
    const { app, cookie } = await setup([entry('a')])
    const response = await post(app, '/entries/a/review', { action: 'comment', body: 'Nice one' }, cookie, { 'hx-request': 'true' })
    expect(response.statusCode).toBe(200)
    expect(response.body).toMatch(/^<details open[^>]*id="entry-a"/)
    expect(response.body).toContain('Nice one')
    expect(response.body).not.toContain('<html')
  })

  it('shows htmx validation errors inside the section', async () => {
    const { app, cookie } = await setup([entry('a')])
    const response = await post(app, '/entries/a/review', { action: 'request-changes', body: '' }, cookie, { 'hx-request': 'true' })
    expect(response.statusCode).toBe(200)
    expect(response.body).toContain('Describe which changes you need')
    expect(await statusOf(app, 'a')).toBe('open')
  })
})

describe('color theme', () => {
  it('follows the system by default and remembers a chosen theme', async () => {
    const { app, cookie } = await setup([entry('a')])
    expect((await page(app, '/', cookie)).body).toMatch(/<html lang="en">/)
    const chosen = await post(app, '/preferences/theme', { theme: 'dark' }, cookie, { referer: 'http://localhost:3000/?show=fix' })
    expect(chosen.statusCode).toBe(303)
    expect(chosen.headers.location).toBe('/?show=fix')
    expect(String(chosen.headers['set-cookie'])).toMatch(/^theme=dark; Path=\/; Max-Age=31536000; SameSite=Lax/)
    const dark = (await page(app, '/', `${cookie}; theme=dark`)).body
    expect(dark).toContain('<html lang="en" data-theme="dark">')
    expect(dark).toContain('value="system"')
  })

  it('ignores unknown themes and foreign referers', async () => {
    const { app, cookie } = await setup([entry('a')])
    const response = await post(app, '/preferences/theme', { theme: 'neon' }, cookie, { referer: 'https://evil.example.com/x' })
    expect(response.headers.location).toBe('/')
    expect(response.headers['set-cookie']).toBeUndefined()
    expect((await page(app, '/', `${cookie}; theme=neon`)).body).toMatch(/<html lang="en">/)
  })

  it('serves fonts and the client script', async () => {
    const { app } = await setup([])
    for (const asset of ['/assets/app.js', '/assets/fonts/ibm-plex-sans-latin-400-normal.woff2', '/assets/fonts/ibm-plex-mono-latin-500-normal.woff2']) {
      expect((await app.inject(asset)).statusCode).toBe(200)
    }
  })
})

describe('image viewer', () => {
  it('links entry images to the viewer grouped by entry, without new tabs', async () => {
    const { app, cookie } = await setup([
      entry('a', { media: [{ before: 'media/b.png', after: 'media/a.png', caption: 'Export' }] }, {
        media: [
          { path: 'media/b.png', sha256: sha(PNG), size: PNG.length, contentType: 'image/png' },
          { path: 'media/a.png', sha256: sha(PNG), size: PNG.length, contentType: 'image/png' },
        ],
      }),
    ])
    const body = (await page(app, '/', cookie)).body
    const links = body.match(/<a href="\/media\/[^"]+"[^>]*>/g) ?? []
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link).toContain('data-lightbox="a"')
      expect(link).not.toContain('target=')
    }
    expect(links[1]).toContain('data-caption="After: Export"')
    expect(body).toContain('<dialog id="lightbox"')
    expect((await app.inject('/assets/app.js')).body).toContain('showModal')
  })
})
