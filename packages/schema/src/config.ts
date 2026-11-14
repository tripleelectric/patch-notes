import { z } from 'zod'
import { httpUrl } from './entry.js'
import { isSafeRelativePath, validate, type Result } from './result.js'
import { parseYaml } from './yaml.js'

export const CONFIG_FILE = 'patchnotes.yaml'

export const configSchema = z.strictObject({
  dir: z
    .string()
    .min(1)
    .refine(isSafeRelativePath, 'must be a relative path inside the project (no absolute paths, ".." or backslashes)')
    .default('.patchnotes'),
  server: httpUrl.optional(),
  appUrl: httpUrl.optional(),
})

export type Config = z.output<typeof configSchema>

export function parseConfig(content: string): Result<Config> {
  const raw = parseYaml(content, CONFIG_FILE)
  if (!raw.ok) return raw
  const result = validate(configSchema, raw.value, CONFIG_FILE)
  if (result.ok) return result
  return {
    ok: false,
    errors: result.errors.map((error) =>
      error.field === 'token'
        ? { ...error, message: `tokens must not be stored in ${CONFIG_FILE}, use the PATCHNOTES_TOKEN environment variable` }
        : error,
    ),
  }
}
