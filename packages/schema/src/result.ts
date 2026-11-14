import type { z } from 'zod'

export interface ValidationError {
  file: string
  field?: string
  message: string
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] }

export function toErrors(error: z.ZodError, file: string): ValidationError[] {
  return error.issues.flatMap((issue): ValidationError[] => {
    const base = issue.path.map(String).join('.')
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({
        file,
        field: base ? `${base}.${key}` : key,
        message: `unknown field "${key}"`,
      }))
    }
    return [base ? { file, field: base, message: issue.message } : { file, message: issue.message }]
  })
}

export function validate<S extends z.ZodType>(schema: S, data: unknown, file: string): Result<z.output<S>> {
  const parsed = schema.safeParse(data, {
    error: (issue) => (issue.code === 'invalid_type' && issue.input === undefined ? 'required' : undefined),
  })
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, errors: toErrors(parsed.error, file) }
}

export function isSafeRelativePath(path: string): boolean {
  return (
    !path.startsWith('/') &&
    !/^[a-zA-Z]:/.test(path) &&
    !path.includes('\\') &&
    !path.split('/').includes('..')
  )
}
