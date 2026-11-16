import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join, posix, relative, sep } from 'node:path'
import {
  mediaPaths,
  mediaTypeProblem,
  parseEntry,
  parseRelease,
  RELEASE_FILE,
  validateEntrySet,
  type Entry,
  type ValidationError,
} from '@patch-notes/schema'
import type { Project } from './project.js'

export interface CheckResult {
  /** Valid entries; `path` stays relative to the patch notes directory. */
  entries: Entry[]
  /** Ship dates from valid `v<version>/release.yaml` files. */
  releases: Array<{ version: string; date: string }>
  /** Errors with paths relative to the project root. */
  errors: ValidationError[]
}

const toPosix = (path: string) => path.split(sep).join('/')

const isEntryFile = (name: string) => name.endsWith('.md')

/** Lists files (entry files by default) as `/`-separated paths relative to the patch notes dir, outside `media/`; undefined if the dir is missing. */
export async function scan(dir: string, match: (name: string) => boolean = isEntryFile): Promise<string[] | undefined> {
  let dirents
  try {
    dirents = await readdir(dir, { recursive: true, withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
  return dirents
    .filter((d) => d.isFile() && match(d.name))
    .map((d) => toPosix(relative(dir, join(d.parentPath, d.name))))
    .filter((path) => !path.startsWith('media/'))
    .sort()
}

async function mediaProblem(dir: string, realDir: string, path: string): Promise<string | undefined> {
  let real: string
  try {
    real = await realpath(join(dir, path))
  } catch {
    return `media file not found: ${path}`
  }
  if (!real.startsWith(realDir + sep)) return `path must stay inside the patch notes directory: ${path}`
  if (!(await stat(real)).isFile()) return `media path is not a file: ${path}`
  return undefined
}

export async function check(project: Project): Promise<CheckResult> {
  const { dir, config } = project
  const files = await scan(dir)
  if (files === undefined) {
    return {
      entries: [],
      releases: [],
      errors: [{ file: config.dir, message: 'patch notes directory not found, create a first entry with "patchnotes new"' }],
    }
  }

  const entries: Entry[] = []
  const errors: ValidationError[] = []
  for (const path of files) {
    const result = parseEntry(await readFile(join(dir, path), 'utf8'), path)
    if (result.ok) entries.push(result.value)
    else errors.push(...result.errors)
  }

  const releases: CheckResult['releases'] = []
  for (const path of (await scan(dir, (name) => name === RELEASE_FILE)) ?? []) {
    const version = /^v(\d+\.\d+\.\d+)\/release\.yaml$/.exec(path)?.[1]
    if (version === undefined) {
      errors.push({ file: path, message: `${RELEASE_FILE} belongs directly in a version directory (vX.Y.Z/)` })
      continue
    }
    const result = parseRelease(await readFile(join(dir, path), 'utf8'), path)
    if (result.ok) releases.push({ version, date: result.value.date })
    else errors.push(...result.errors)
  }

  const realDir = await realpath(dir)
  for (const entry of entries) {
    for (const [index, item] of (entry.data.media ?? []).entries()) {
      for (const [key, path] of mediaPaths(item)) {
        const message = mediaTypeProblem(key, path) ?? (await mediaProblem(dir, realDir, path))
        if (message) errors.push({ file: entry.path, field: `media.${index}.${key}`, message })
      }
    }
    if (entry.data.try?.startsWith('/') && config.appUrl === undefined) {
      errors.push({ file: entry.path, field: 'try', message: 'a path try link needs appUrl in patchnotes.yaml' })
    }
  }

  const prefix = (path: string) => posix.join(config.dir, path)
  return {
    entries,
    releases,
    errors: [
      ...errors.map((error) => ({ ...error, file: prefix(error.file) })),
      ...validateEntrySet(entries.map((entry) => ({ ...entry, path: prefix(entry.path) }))),
    ],
  }
}
