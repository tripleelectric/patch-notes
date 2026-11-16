import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Transform, type Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  MEDIA_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
  publishPayloadSchema,
  resolvePublishedEntry,
  sha256Schema,
  type EntryData,
  type PublishResult,
} from '@patch-notes/schema'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import type { Prisma } from '../generated/prisma/client.js'
import { mediaDir, mediaFileName } from '../media.js'

const digest = (value: string) => createHash('sha256').update(value).digest()
const fail = (reply: FastifyReply, status: number, error: string, details?: unknown) =>
  reply.status(status).send(details === undefined ? { error } : { error, details })

class TooLarge extends Error {}

type PreparedEntry = Omit<EntryData, 'media'> & { body: string; media: unknown[]; path: string; version: string | null; contentHash: string }

export async function publishRoutes(api: FastifyInstance) {
  const { prisma, config } = api

  api.addHook('onRequest', async (request, reply) => {
    if (!config.publishToken) return fail(reply, 503, 'publishing is disabled: set PUBLISH_TOKEN on the server')
    const header = request.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!timingSafeEqual(digest(token), digest(config.publishToken))) return fail(reply, 401, 'invalid publish token')
  })

  // Media bodies stay streams; the handler hashes and writes them to disk.
  for (const type of MEDIA_CONTENT_TYPES) api.addContentTypeParser(type, (_request, payload, done) => done(null, payload))

  api.post('/api/media/missing', async (request, reply) => {
    const parsed = z.object({ hashes: z.array(sha256Schema).max(10_000) }).safeParse(request.body)
    if (!parsed.success) return fail(reply, 400, 'expected {"hashes": [sha256, ...]}')
    const known = await prisma.media.findMany({ where: { sha256: { in: parsed.data.hashes } }, select: { sha256: true } })
    const knownSet = new Set(known.map((m) => m.sha256))
    return { missing: [...new Set(parsed.data.hashes)].filter((hash) => !knownSet.has(hash)) }
  })

  const contentTypeOf = (headers: { 'content-type'?: string | undefined }) =>
    String(headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase()

  // Checked before body parsing, so e.g. a JSON content type is rejected as unsupported, not as malformed JSON.
  const preParsing = async (request: { headers: { 'content-type'?: string | undefined } }, reply: FastifyReply) => {
    if (!MEDIA_CONTENT_TYPES.includes(contentTypeOf(request.headers))) {
      return fail(reply, 415, `unsupported media type, expected one of: ${MEDIA_CONTENT_TYPES.join(', ')}`)
    }
  }

  api.put('/api/media/:sha256', { preParsing }, async (request, reply) => {
    const body = request.body as Readable
    const drain = () => body.resume()
    const sha256 = (request.params as { sha256: string }).sha256
    if (!sha256Schema.safeParse(sha256).success) return drain(), fail(reply, 400, 'path must be a lowercase SHA-256 hex string')
    const contentType = contentTypeOf(request.headers)
    if (Number(request.headers['content-length'] ?? 0) > MEDIA_MAX_BYTES) return fail(reply, 413, 'media file larger than 200 MB')
    if (await prisma.media.findUnique({ where: { sha256 } })) return drain(), reply.status(200).send({ status: 'exists' })

    const dir = mediaDir(config)
    await mkdir(dir, { recursive: true })
    const temp = join(dir, `.upload-${randomUUID()}`)
    const hash = createHash('sha256')
    let size = 0
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.length
        if (size > MEDIA_MAX_BYTES) return callback(new TooLarge())
        hash.update(chunk)
        callback(null, chunk)
      },
    })
    try {
      await pipeline(body, counter, createWriteStream(temp, { flags: 'wx' }))
    } catch (error) {
      await rm(temp, { force: true })
      if (error instanceof TooLarge) return fail(reply, 413, 'media file larger than 200 MB')
      throw error
    }
    if (hash.digest('hex') !== sha256) {
      await rm(temp, { force: true })
      return fail(reply, 400, 'content does not match the SHA-256 in the path')
    }
    await rename(temp, join(dir, mediaFileName(sha256, contentType)))
    await prisma.media.upsert({ where: { sha256 }, create: { sha256, contentType, size }, update: {} })
    return reply.status(201).send({ status: 'created' })
  })

  api.post('/api/publish', { bodyLimit: 20 * 1024 * 1024 }, async (request, reply) => {
    const payload = publishPayloadSchema.safeParse(request.body)
    if (!payload.success) {
      return fail(reply, 400, 'invalid publish payload', payload.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })))
    }

    const errors: Array<{ entry: string; field?: string; message: string }> = []
    const entries: PreparedEntry[] = []
    const seen = new Set<string>()
    for (const entry of payload.data.entries) {
      const resolved = resolvePublishedEntry(entry)
      if (!resolved.ok) {
        errors.push(...resolved.errors.map((e) => ({ entry: entry.path, ...e })))
        continue
      }
      const { media: _paths, ...fields } = resolved.data
      if (seen.has(fields.id)) errors.push({ entry: entry.path, field: 'id', message: `duplicate id "${fields.id}"` })
      seen.add(fields.id)
      const stored = { ...fields, body: entry.body, media: resolved.media }
      entries.push({ ...stored, path: entry.path, version: entry.version, contentHash: digest(JSON.stringify(stored)).toString('hex') })
    }
    const hashes = [...new Set(payload.data.entries.flatMap((e) => e.media.map((m) => m.sha256)))]
    const known = new Set((await prisma.media.findMany({ where: { sha256: { in: hashes } }, select: { sha256: true } })).map((m) => m.sha256))
    for (const entry of payload.data.entries) {
      for (const file of entry.media) {
        if (!known.has(file.sha256)) errors.push({ entry: entry.path, message: `media ${file.path} (${file.sha256}) was not uploaded` })
      }
    }
    const versions = payload.data.releases.map((r) => r.version)
    for (const version of versions.filter((v, i) => versions.indexOf(v) !== i)) {
      errors.push({ entry: `v${version}/release.yaml`, message: `release ${version} listed twice` })
    }
    if (errors.length > 0) return fail(reply, 400, 'publish rejected', errors)

    const now = new Date()
    const result: PublishResult = await prisma.$transaction(async (tx) => {
      const counts: PublishResult = { created: 0, updated: 0, unchanged: 0, removed: 0 }
      const existing = new Map((await tx.entry.findMany()).map((e) => [e.id, e]))
      for (const entry of entries) {
        const columns = {
          path: entry.path,
          version: entry.version,
          title: entry.title,
          type: entry.type,
          date: entry.date,
          requests: entry.requests ?? [],
          try: entry.try ?? null,
          media: entry.media as Prisma.InputJsonValue,
          body: entry.body,
          contentHash: entry.contentHash,
          publishedAt: now,
          removedAt: null,
        }
        const current = existing.get(entry.id)
        if (!current) {
          await tx.entry.create({ data: { id: entry.id, ...columns } })
          counts.created++
        } else if (current.contentHash !== entry.contentHash) {
          await tx.entry.update({ where: { id: entry.id }, data: { ...columns, status: 'open' } })
          await tx.reviewEvent.create({ data: { entryId: entry.id, kind: 'updated' } })
          counts.updated++
        } else if (current.version !== entry.version || current.path !== entry.path || current.removedAt !== null) {
          await tx.entry.update({ where: { id: entry.id }, data: { path: entry.path, version: entry.version, publishedAt: now, removedAt: null } })
          counts.updated++
        } else {
          counts.unchanged++
        }
      }
      const ids = new Set(entries.map((e) => e.id))
      const gone = [...existing.values()].filter((e) => !ids.has(e.id) && e.removedAt === null).map((e) => e.id)
      if (gone.length > 0) await tx.entry.updateMany({ where: { id: { in: gone } }, data: { removedAt: now } })
      counts.removed = gone.length

      await tx.release.deleteMany()
      if (payload.data.releases.length > 0) await tx.release.createMany({ data: payload.data.releases })

      const appUrl = payload.data.appUrl
      if (appUrl) await tx.setting.upsert({ where: { key: 'appUrl' }, create: { key: 'appUrl', value: appUrl }, update: { value: appUrl } })
      else await tx.setting.deleteMany({ where: { key: 'appUrl' } })
      return counts
    })
    return result
  })
}
