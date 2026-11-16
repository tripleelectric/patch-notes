import { mkdir, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { parseRelease, RELEASE_FILE } from '@patch-notes/schema'
import { join, posix } from 'node:path'
import { check } from '../check.js'
import { parse, UsageError, type Io } from '../io.js'
import { loadProject, printErrors } from '../project.js'
import { BUMPS, nextVersion, VERSION } from '../version.js'
import { localDate } from '../date.js'

export async function releaseCommand(args: string[], io: Io): Promise<number | 'help'> {
  const { values, positionals } = parse(args, { date: { type: 'string' } })
  if (values.help) return 'help'
  const date = values.date ?? localDate(io.now())
  if (!parseRelease(`date: ${JSON.stringify(date)}`, RELEASE_FILE).ok) throw new UsageError(`invalid --date "${date}", expected YYYY-MM-DD`)
  const [arg, ...extra] = positionals
  if (arg === undefined || extra.length > 0 || !((BUMPS as readonly string[]).includes(arg) || VERSION.test(arg))) {
    throw new UsageError('expected one version: patchnotes release <patch|minor|major|X.Y.Z>')
  }

  const project = await loadProject(io.cwd)
  if (!project.ok) {
    printErrors(io, project.errors)
    return 1
  }
  const { dir, config } = project.value
  const { entries, errors } = await check(project.value)
  if (errors.length > 0) {
    printErrors(io, errors)
    return 1
  }
  const unreleased = entries.filter((entry) => entry.version === null).map((entry) => posix.basename(entry.path))
  if (unreleased.length === 0) {
    io.stderr(`nothing to release: no entries in ${posix.join(config.dir, 'unreleased')}`)
    return 1
  }

  const existing = (await readdir(dir)).flatMap((name) => /^v(\d+\.\d+\.\d+)$/.exec(name)?.[1] ?? []).filter((v) => VERSION.test(v))
  const version = nextVersion(arg, existing)
  if (!version.ok) {
    io.stderr(version.message)
    return 1
  }

  const source = join(dir, 'unreleased')
  const target = join(dir, `v${version.value}`)
  const shownTarget = posix.join(config.dir, `v${version.value}`)
  try {
    await mkdir(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    io.stderr(`${shownTarget} already exists`)
    return 1
  }

  const moved: string[] = []
  try {
    await writeFile(join(target, RELEASE_FILE), `date: ${date}\n`, { flag: 'wx' })
    for (const name of unreleased) {
      await rename(join(source, name), join(target, name))
      moved.push(name)
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    try {
      for (const name of moved.toReversed()) await rename(join(target, name), join(source, name))
      await rm(join(target, RELEASE_FILE), { force: true })
      await rmdir(target)
    } catch (rollbackError) {
      io.stderr(`release failed: ${reason}`)
      io.stderr(`rollback failed, move these files back to unreleased/ by hand: ${moved.join(', ')} (in ${shownTarget})`)
      throw rollbackError
    }
    io.stderr(`release failed, nothing moved: ${reason}`)
    return 1
  }

  io.stdout(`released ${version.value} on ${date}: ${moved.length} ${moved.length === 1 ? 'entry' : 'entries'} moved to ${shownTarget}`)
  return 0
}
