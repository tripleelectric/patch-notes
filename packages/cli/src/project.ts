import { access, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { CONFIG_FILE, parseConfig, type Config, type Result, type ValidationError } from '@patch-notes/schema'
import type { Io } from './io.js'

export interface Project {
  root: string
  config: Config
  /** Absolute path of the patch notes directory. */
  dir: string
}

const exists = (path: string) => access(path).then(() => true, () => false)

async function nearest(start: string, name: string): Promise<string | undefined> {
  for (let dir = start; ; dir = dirname(dir)) {
    if (await exists(join(dir, name))) return dir
    if (dirname(dir) === dir) return undefined
  }
}

export async function findRoot(cwd: string): Promise<{ root: string; hasConfig: boolean }> {
  const withConfig = await nearest(cwd, CONFIG_FILE)
  if (withConfig !== undefined) return { root: withConfig, hasConfig: true }
  return { root: (await nearest(cwd, '.git')) ?? cwd, hasConfig: false }
}

export async function loadProject(cwd: string): Promise<Result<Project>> {
  const { root, hasConfig } = await findRoot(cwd)
  const config = parseConfig(hasConfig ? await readFile(join(root, CONFIG_FILE), 'utf8') : '')
  if (!config.ok) return config
  return { ok: true, value: { root, config: config.value, dir: join(root, config.value.dir) } }
}

export function printErrors(io: Io, errors: readonly ValidationError[]): void {
  for (const { file, field, message } of errors) io.stderr(field ? `${file}: ${field}: ${message}` : `${file}: ${message}`)
}
