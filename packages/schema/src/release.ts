import { z } from 'zod'
import { validate, type Result } from './result.js'
import { parseYaml } from './yaml.js'

export const RELEASE_FILE = 'release.yaml'

export const calendarDate = z.iso.date({ error: 'must be a real calendar date in YYYY-MM-DD format' })

export const releaseSchema = z.strictObject({ date: calendarDate })

export type ReleaseData = z.output<typeof releaseSchema>

/** Parses `v<version>/release.yaml`; `relPath` is relative to the patch notes directory. */
export function parseRelease(content: string, relPath: string): Result<ReleaseData> {
  const raw = parseYaml(content, relPath)
  if (!raw.ok) return raw
  return validate(releaseSchema, raw.value, relPath)
}
