import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PublishedEntry } from '@patch-notes/schema'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { testApp } from './test-utils.js'

const TOKEN = 't'.repeat(40)
const PNG = Buffer.from('89504e470d0a1a0a0000', 'hex')
const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex')

const auth = (token = TOKEN) => ({ authorization: `Bearer ${token}` })
const app = () => testApp({ publishToken: TOKEN })

const upload = (server: FastifyInstance, data: Buffer, contentType = 'image/png', hash = sha(data)) =>
  server.inject({ method: 'PUT', url: `/api/media/${hash}`, payload: data, headers: { ...auth(), 'content-type': contentType } })

const publish = (server: FastifyInstance, entries: PublishedEntry[], appUrl?: string) =>
  server.inject({ method: 'POST', url: '/api/publish', payload: { entries, ...(appUrl && { appUrl }) }, headers: auth() })

function entry(id: string, overrides: Partial<PublishedEntry> & { data?: Record<string, unknown> } = {}): PublishedEntry {
  const { data, ...rest } = overrides
  return {
    path: `unreleased/${id}.md`,
    version: null,
    data: { id, title: `Title ${id}`, type: 'feature', date: '2026-11-14', ...data },
    body: `Body ${id}`,
    media: [],
    ...rest,
  }
}

const withImage = (id: string, data = PNG): PublishedEntry =>
  entry(id, {
    data: { media: [{ image: 'media/a.png' }] },
    media: [{ path: 'media/a.png', sha256: sha(data), size: data.length, contentType: 'image/png' }],
  })

describe('token', () => {
  it('rejects a wrong token', async () => {
    const server = await app()
    const response = await server.inject({ method: 'POST', url: '/api/publish', payload: { entries: [entry('a')] }, headers: auth('wrong') })
    expect(response.statusCode).toBe(401)
    expect(await server.prisma.entry.count()).toBe(0)
  })

  it('rejects a missing token', async () => {
    expect((await (await app()).inject({ method: 'POST', url: '/api/media/missing', payload: { hashes: [] } })).statusCode).toBe(401)
  })

  it('is disabled without PUBLISH_TOKEN', async () => {
    const server = await testApp()
    expect((await server.inject({ method: 'POST', url: '/api/publish', payload: { entries: [] }, headers: auth() })).statusCode).toBe(503)
  })
})

describe('media', () => {
  it('reports missing hashes in request order', async () => {
    const server = await app()
    expect((await upload(server, PNG)).statusCode).toBe(201)
    const other = 'b'.repeat(64)
    const response = await server.inject({ method: 'POST', url: '/api/media/missing', payload: { hashes: [other, sha(PNG)] }, headers: auth() })
    expect(response.json()).toEqual({ missing: [other] })
  })

  it('stores a valid upload once', async () => {
    const server = await app()
    expect((await upload(server, PNG)).statusCode).toBe(201)
    expect(existsSync(join(server.config.dataDir, 'media', `${sha(PNG)}.png`))).toBe(true)
    expect((await upload(server, PNG)).statusCode).toBe(200)
  })

  it('rejects a hash mismatch', async () => {
    const server = await app()
    expect((await upload(server, PNG, 'image/png', 'c'.repeat(64))).statusCode).toBe(400)
    expect(await server.prisma.media.count()).toBe(0)
  })

  it.each(['image/svg+xml', 'application/json', 'text/html'])('rejects %s', async (type) => {
    const server = await app()
    expect((await upload(server, PNG, type)).statusCode).toBe(415)
    expect(await server.prisma.media.count()).toBe(0)
  })

  it('rejects a declared size over the limit', async () => {
    const server = await app()
    const response = await server.inject({
      method: 'PUT',
      url: `/api/media/${sha(PNG)}`,
      payload: PNG,
      headers: { ...auth(), 'content-type': 'image/png', 'content-length': String(201 * 1024 * 1024) },
    })
    expect(response.statusCode).toBe(413)
  })
})

describe('publish', () => {
  it('rejects unknown media and changes nothing', async () => {
    const server = await app()
    const response = await publish(server, [withImage('a')])
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain(sha(PNG))
    expect(await server.prisma.entry.count()).toBe(0)
  })

  it('rejects invalid entries naming id and field', async () => {
    const server = await app()
    const response = await publish(server, [entry('a', { data: { type: 'bugfix' } })])
    expect(response.statusCode).toBe(400)
    expect(response.json().details).toEqual([expect.objectContaining({ entry: 'unreleased/a.md', field: 'type' })])
  })

  it('creates, keeps idempotent, removes and restores', async () => {
    const server = await app()
    await upload(server, PNG)
    expect((await publish(server, [withImage('a'), entry('b')], 'https://app.example.com')).json()).toEqual({ created: 2, updated: 0, unchanged: 0, removed: 0 })
    expect((await publish(server, [withImage('a'), entry('b')])).json()).toEqual({ created: 0, updated: 0, unchanged: 2, removed: 0 })
    expect((await publish(server, [withImage('a')])).json()).toEqual({ created: 0, updated: 0, unchanged: 1, removed: 1 })
    expect((await server.prisma.entry.findUniqueOrThrow({ where: { id: 'b' } })).removedAt).not.toBeNull()
    expect((await publish(server, [withImage('a'), entry('b')])).json()).toEqual({ created: 0, updated: 1, unchanged: 1, removed: 0 })
    expect((await server.prisma.entry.findUniqueOrThrow({ where: { id: 'b' } })).removedAt).toBeNull()

    const stored = await server.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })
    expect(stored.media).toEqual([{ image: { sha256: sha(PNG), contentType: 'image/png' } }])
    expect(stored.status).toBe('open')
  })

  it('keeps a change request on release and clears it on content change', async () => {
    const server = await app()
    await publish(server, [entry('a')])
    await server.prisma.entry.update({ where: { id: 'a' }, data: { status: 'changes-requested' } })

    const released = entry('a', { path: 'v1.4.0/a.md', version: '1.4.0' })
    expect((await publish(server, [released])).json()).toMatchObject({ updated: 1 })
    expect(await server.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).toMatchObject({ status: 'changes-requested', version: '1.4.0' })

    expect((await publish(server, [{ ...released, body: 'Changed' }])).json()).toMatchObject({ updated: 1 })
    expect(await server.prisma.entry.findUniqueOrThrow({ where: { id: 'a' } })).toMatchObject({ status: 'open', body: 'Changed' })
    expect(await server.prisma.reviewEvent.findMany({ select: { kind: true } })).toEqual([{ kind: 'updated' }])
  })

  it('stores and clears appUrl', async () => {
    const server = await app()
    await publish(server, [], 'https://app.example.com')
    expect(await server.prisma.setting.findUnique({ where: { key: 'appUrl' } })).toMatchObject({ value: 'https://app.example.com' })
    await publish(server, [])
    expect(await server.prisma.setting.count()).toBe(0)
  })
})
