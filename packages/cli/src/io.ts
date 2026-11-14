import { parseArgs, type ParseArgsOptionsConfig } from 'node:util'

export interface Io {
  cwd: string
  stdout: (line: string) => void
  stderr: (line: string) => void
  now: () => Date
  env: Record<string, string | undefined>
}

export class UsageError extends Error {}

export function parse<O extends ParseArgsOptionsConfig>(args: string[], options: O) {
  try {
    return parseArgs({ args, options: { ...options, help: { type: 'boolean', short: 'h' } }, allowPositionals: true, strict: true })
  } catch (error) {
    if (error instanceof Error && 'code' in error && String(error.code).startsWith('ERR_PARSE_ARGS')) {
      throw new UsageError(error.message)
    }
    throw error
  }
}
