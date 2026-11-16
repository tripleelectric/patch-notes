import { z } from 'zod'
import { entrySchema, httpUrl, type MediaItem } from './entry.js'
import { calendarDate } from './release.js'

export const MEDIA_TYPES = {
  png: { contentType: 'image/png', kind: 'image' },
  jpg: { contentType: 'image/jpeg', kind: 'image' },
  jpeg: { contentType: 'image/jpeg', kind: 'image' },
  webp: { contentType: 'image/webp', kind: 'image' },
  gif: { contentType: 'image/gif', kind: 'image' },
  mp4: { contentType: 'video/mp4', kind: 'video' },
  webm: { contentType: 'video/webm', kind: 'video' },
} as const

export type MediaKind = 'image' | 'video'
export const MEDIA_CONTENT_TYPES: readonly string[] = [...new Set(Object.values(MEDIA_TYPES).map((t) => t.contentType))]
export const MEDIA_MAX_BYTES = 200 * 1024 * 1024

/** Media type of a path by extension, or undefined when unsupported. */
export function mediaType(path: string): (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES] | undefined {
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase()
  return ext !== undefined && Object.hasOwn(MEDIA_TYPES, ext) ? MEDIA_TYPES[ext as keyof typeof MEDIA_TYPES] : undefined
}

/** Every `[field, path]` referenced by a media item; `field` is `image`, `video`, `before` or `after`. */
export function mediaPaths(item: MediaItem): Array<[keyof MediaItem & string, string]> {
  return Object.entries(item).filter(([key]) => key !== 'caption') as Array<[keyof MediaItem & string, string]>
}

/** Error message when a media path's type does not fit its field, else undefined. */
export function mediaTypeProblem(field: string, path: string): string | undefined {
  const type = mediaType(path)
  const supported = Object.keys(MEDIA_TYPES).map((ext) => `.${ext}`).join(', ')
  if (!type) return `unsupported media type: ${path} (supported: ${supported})`
  const expected: MediaKind = field === 'video' ? 'video' : 'image'
  if (type.kind !== expected) return `${field} must be ${expected === 'video' ? 'a video (.mp4, .webm)' : 'an image'}: ${path}`
  return undefined
}

export const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/, 'must be a lowercase SHA-256 hex string')

export const publishedMediaSchema = z.strictObject({
  path: z.string().min(1),
  sha256: sha256Schema,
  size: z.number().int().min(0).max(MEDIA_MAX_BYTES),
  contentType: z.string().refine((type) => MEDIA_CONTENT_TYPES.includes(type), `must be one of: ${MEDIA_CONTENT_TYPES.join(', ')}`),
})

export const publishedEntrySchema = z
  .strictObject({
    path: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/).nullable(),
    // Validated with `entrySchema` by the receiver, so its errors carry field names.
    data: z.record(z.string(), z.unknown()),
    body: z.string().max(200_000),
    media: z.array(publishedMediaSchema).max(100),
  })

export const publishedReleaseSchema = z.strictObject({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  date: calendarDate,
})

export const publishPayloadSchema = z.strictObject({
  appUrl: httpUrl.optional(),
  releases: z.array(publishedReleaseSchema).max(10_000).default([]),
  entries: z.array(publishedEntrySchema).max(10_000),
})

export type PublishedMedia = z.output<typeof publishedMediaSchema>
export type PublishedEntry = z.output<typeof publishedEntrySchema>
export type PublishPayload = z.output<typeof publishPayloadSchema>

export interface PublishResult {
  created: number
  updated: number
  unchanged: number
  removed: number
}

/** Validates entry data and resolves every media path to its published file; errors use the entry id or path as `file`. */
export function resolvePublishedEntry(entry: PublishedEntry) {
  const data = entrySchema.safeParse(entry.data)
  if (!data.success) {
    return { ok: false as const, errors: data.error.issues.map((i) => ({ field: i.path.map(String).join('.') || undefined, message: i.message })) }
  }
  const byPath = new Map(entry.media.map((m) => [m.path, m]))
  const errors: Array<{ field?: string; message: string }> = []
  const media = (data.data.media ?? []).map((item, index) => {
    const resolved: Record<string, unknown> = item.caption === undefined ? {} : { caption: item.caption }
    for (const [field, path] of mediaPaths(item)) {
      const file = byPath.get(path)
      if (!file) errors.push({ field: `media.${index}.${field}`, message: `no published file for ${path}` })
      else resolved[field] = { sha256: file.sha256, contentType: file.contentType }
    }
    return resolved
  })
  if (errors.length > 0) return { ok: false as const, errors }
  return { ok: true as const, data: data.data, media }
}
