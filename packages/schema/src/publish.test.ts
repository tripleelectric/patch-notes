import { describe, expect, it } from 'vitest'
import { mediaTypeProblem, publishPayloadSchema, resolvePublishedEntry, type PublishedEntry } from './publish.js'

const hash = 'a'.repeat(64)
const entry: PublishedEntry = {
  path: 'unreleased/a.md',
  version: null,
  data: { id: 'a', title: 'A', type: 'feature', date: '2026-11-14', media: [{ before: 'media/1.png', after: 'media/2.png', caption: 'C' }] },
  body: 'Body',
  media: [
    { path: 'media/1.png', sha256: hash, size: 1, contentType: 'image/png' },
    { path: 'media/2.png', sha256: 'b'.repeat(64), size: 1, contentType: 'image/png' },
  ],
}

describe('publish payload', () => {
  it('accepts a valid payload and resolves media to hashes', () => {
    expect(publishPayloadSchema.safeParse({ appUrl: 'https://app.example.com', entries: [entry] }).success).toBe(true)
    const resolved = resolvePublishedEntry(entry)
    expect(resolved.ok && resolved.media).toEqual([
      { caption: 'C', before: { sha256: hash, contentType: 'image/png' }, after: { sha256: 'b'.repeat(64), contentType: 'image/png' } },
    ])
  })

  it('rejects an unsupported content type', () => {
    const bad = { ...entry, media: [{ ...entry.media[0]!, contentType: 'image/svg+xml' }] }
    expect(publishPayloadSchema.safeParse({ entries: [bad] }).success).toBe(false)
  })

  it('reports a media path missing from the map', () => {
    const result = resolvePublishedEntry({ ...entry, media: entry.media.slice(0, 1) })
    expect(!result.ok && result.errors).toEqual([{ field: 'media.0.after', message: 'no published file for media/2.png' }])
  })

  it('reports invalid entry data with field names', () => {
    const result = resolvePublishedEntry({ ...entry, data: { ...entry.data, type: 'bugfix' } })
    expect(!result.ok && result.errors.map((e) => e.field)).toEqual(['type'])
  })
})

describe('mediaTypeProblem', () => {
  it.each([
    ['image', 'media/a.png', undefined],
    ['before', 'media/a.JPG', undefined],
    ['video', 'media/a.webm', undefined],
    ['image', 'media/logo.svg', /unsupported media type.*\.png/],
    ['image', 'media/flow.webm', /must be an image/],
    ['video', 'media/a.png', /must be a video/],
  ])('%s %s', (field, path, expected) => {
    const problem = mediaTypeProblem(field, path)
    if (expected === undefined) expect(problem).toBeUndefined()
    else expect(problem).toMatch(expected)
  })
})
