import { mkdir, writeFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { entrySchema, parseEntry } from '@patch-notes/schema'
import { stringify } from 'yaml'
import { scan } from '../check.js'
import { parse, UsageError, type Io } from '../io.js'
import { loadProject, printErrors } from '../project.js'
import { slugify } from '../slug.js'

const TYPES: readonly string[] = entrySchema.shape.type.options
const BODY = '## What changed\n\n## Why\n\n## Decisions\n'

const localDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')

export async function newCommand(args: string[], io: Io): Promise<number | 'help'> {
  const { values, positionals } = parse(args, {
    type: { type: 'string' },
    id: { type: 'string' },
    request: { type: 'string', multiple: true },
    try: { type: 'string' },
  })
  if (values.help) return 'help'
  const [title, ...extra] = positionals
  if (title === undefined || extra.length > 0) throw new UsageError('expected one title: patchnotes new <title> --type <type>')
  if (values.type === undefined) throw new UsageError(`missing --type, expected one of: ${TYPES.join(', ')}`)
  if (!TYPES.includes(values.type)) {
    throw new UsageError(`invalid --type "${values.type}", expected one of: ${TYPES.join(', ')}`)
  }

  const id = values.id ?? slugify(title)
  if (id === '') {
    io.stderr('cannot derive an id from the title, pass one with --id')
    return 1
  }

  const project = await loadProject(io.cwd)
  if (!project.ok) {
    printErrors(io, project.errors)
    return 1
  }
  const { dir, config } = project.value
  const relPath = `unreleased/${id}.md`
  const shown = posix.join(config.dir, relPath)

  const data = {
    id,
    title,
    type: values.type,
    date: localDate(io.now()),
    ...(values.request && { requests: values.request }),
    ...(values.try !== undefined && { try: values.try }),
  }
  const content = `---\n${stringify(data)}---\n\n${BODY}`
  const parsed = parseEntry(content, relPath)
  if (!parsed.ok) {
    printErrors(io, parsed.errors.map((error) => ({ ...error, file: shown })))
    return 1
  }

  const existing = (await scan(dir))?.find((path) => posix.basename(path) === `${id}.md`)
  if (existing !== undefined) {
    io.stderr(`id "${id}" already used by ${posix.join(config.dir, existing)}`)
    return 1
  }

  await mkdir(join(dir, 'unreleased'), { recursive: true })
  try {
    await writeFile(join(dir, relPath), content, { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    io.stderr(`id "${id}" already used by ${shown}`)
    return 1
  }
  io.stdout(shown)
  return 0
}
