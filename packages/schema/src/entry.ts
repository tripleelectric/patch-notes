import { z } from 'zod'
import { isSafeRelativePath, validate, type Result, type ValidationError } from './result.js'
import { splitFrontmatter } from './yaml.js'

export const httpUrl = z.url({ protocol: /^https?$/, error: 'must be an absolute http or https URL' })

const mediaPath = z
  .string()
  .min(1)
  .refine(isSafeRelativePath, 'path must stay inside the patch notes directory (no absolute paths, ".." or backslashes)')

export type MediaItem = ({ image: string } | { video: string } | { before: string; after: string }) & { caption?: string }

const mediaItem = z
  .strictObject({
    image: mediaPath.optional(),
    video: mediaPath.optional(),
    before: mediaPath.optional(),
    after: mediaPath.optional(),
    caption: z.string().min(1).optional(),
  })
  .transform((item, ctx): MediaItem => {
    const { image, video, before, after, caption } = item
    const extra = caption === undefined ? {} : { caption }
    const isPair = before !== undefined || after !== undefined
    if ([image !== undefined, video !== undefined, isPair].filter(Boolean).length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'media item must have exactly one of: image, video, or before and after' })
      return z.NEVER
    }
    if (image !== undefined) return { image, ...extra }
    if (video !== undefined) return { video, ...extra }
    if (before === undefined || after === undefined) {
      ctx.addIssue({ code: 'custom', message: 'media item needs both before and after' })
      return z.NEVER
    }
    return { before, after, ...extra }
  })

export const entrySchema = z.strictObject({
  id: z
    .string()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (lowercase letters, digits and single dashes)'),
  title: z.string().min(1).max(120),
  type: z.enum(['feature', 'fix', 'change']),
  date: z.iso.date({ error: 'must be a real calendar date in YYYY-MM-DD format' }),
  requests: z.array(httpUrl).optional(),
  try: z.union([httpUrl, z.string().regex(/^\/(?!\/)/)], {
    error: 'must be an absolute http or https URL or a path starting with "/"',
  }).optional(),
  media: z.array(mediaItem).optional(),
})

export type EntryData = z.output<typeof entrySchema>

export interface Entry {
  /** Path relative to the patch notes directory, e.g. `unreleased/invoice-export.md`. */
  path: string
  /** Release version like `1.4.0`, or null for unreleased. */
  version: string | null
  data: EntryData
  body: string
}

const VERSION_DIR = /^v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/

export function resolveRelease(relPath: string): Result<string | null> {
  const parts = relPath.split('/')
  const [dir] = parts
  if (parts.length !== 2 || dir === undefined) {
    return { ok: false, errors: [{ file: relPath, message: 'entry must live directly in "unreleased/" or a "vX.Y.Z/" directory' }] }
  }
  if (dir === 'unreleased') return { ok: true, value: null }
  const version = VERSION_DIR.exec(dir)?.[1]
  if (version !== undefined) return { ok: true, value: version }
  return {
    ok: false,
    errors: [{ file: relPath, message: `unknown directory "${dir}": expected "unreleased" or "vX.Y.Z"` }],
  }
}

export function parseEntry(content: string, relPath: string): Result<Entry> {
  const errors: ValidationError[] = []
  const release = resolveRelease(relPath)
  if (!release.ok) errors.push(...release.errors)
  if (!relPath.endsWith('.md')) errors.push({ file: relPath, message: 'entry file must have the .md extension' })

  const split = splitFrontmatter(content, relPath)
  if (!split.ok) return { ok: false, errors: [...errors, ...split.errors] }

  const data = validate(entrySchema, split.value.data, relPath)
  if (!data.ok) return { ok: false, errors: [...errors, ...data.errors] }

  const fileId = relPath.split('/').pop()!.replace(/\.md$/, '')
  if (data.value.id !== fileId) {
    errors.push({ file: relPath, field: 'id', message: `id "${data.value.id}" differs from file name "${fileId}"` })
  }
  if (errors.length > 0 || !release.ok) return { ok: false, errors }
  return { ok: true, value: { path: relPath, version: release.value, data: data.value, body: split.value.body } }
}

export function validateEntrySet(entries: readonly Entry[]): ValidationError[] {
  const seen = new Map<string, string>()
  const errors: ValidationError[] = []
  for (const entry of entries) {
    const first = seen.get(entry.data.id)
    if (first === undefined) seen.set(entry.data.id, entry.path)
    else errors.push({ file: entry.path, field: 'id', message: `duplicate id "${entry.data.id}", also used by ${first}` })
  }
  return errors
}
