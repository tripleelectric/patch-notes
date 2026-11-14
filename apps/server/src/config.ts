import { resolve } from 'node:path'
import { z } from 'zod'

const optional = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === '' ? undefined : value), schema)

const envSchema = z.object({
  DATA_DIR: optional(z.string().default('./data')),
  PORT: optional(z.coerce.number().int().min(1).max(65535).default(3000)),
  HOST: optional(z.string().default('0.0.0.0')),
  BASE_URL: optional(z.url({ protocol: /^https?$/, error: (issue) => (issue.input === undefined ? 'required' : 'must be an absolute http or https URL') })),
})

export interface Config {
  dataDir: string
  port: number
  host: string
  baseUrl: string
}

export function loadConfig(env: Record<string, string | undefined>): { ok: true; value: Config } | { ok: false; errors: string[] } {
  const parsed = envSchema.safeParse(env, {
    error: (issue) => (issue.input === undefined ? 'required' : undefined),
  })
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }
  const { DATA_DIR, PORT, HOST, BASE_URL } = parsed.data
  return { ok: true, value: { dataDir: resolve(DATA_DIR), port: PORT, host: HOST, baseUrl: BASE_URL.replace(/\/+$/, '') } }
}
