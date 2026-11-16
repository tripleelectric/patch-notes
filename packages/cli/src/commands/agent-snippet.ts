import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { entrySchema, MEDIA_TYPES, type Language } from '@patch-notes/schema'
import { HEADINGS } from '../headings.js'
import { parse, UsageError, type Io } from '../io.js'
import { loadProject, printErrors } from '../project.js'

export const START = '<!-- patchnotes:start -->'
export const END = '<!-- patchnotes:end -->'

const LANGUAGE_NAME: Record<Language, string> = { en: 'English', de: 'German' }

export function snippet(dir: string, language: Language = 'en'): string {
  const [changed, why, decisions] = HEADINGS[language]
  const types = entrySchema.shape.type.options.join('|')
  const images = Object.entries(MEDIA_TYPES).filter(([, t]) => t.kind === 'image').map(([ext]) => `.${ext}`).join(', ')
  const videos = Object.entries(MEDIA_TYPES).filter(([, t]) => t.kind === 'video').map(([ext]) => `.${ext}`).join(', ')
  return `${START}
## Patch notes

Every user-visible change (feature, fix or changed behavior) gets a patch note entry, so PM/PO can review it. Write it when the change is done:

1. \`patchnotes new "<title>" --type <${types}> [--request <ticket-url>]... [--try </path/in/app>]\`
   It creates \`${dir}/unreleased/<id>.md\` and prints the path. The title is plain language a PM understands.
   Write the title and body in ${LANGUAGE_NAME[language]}.
2. Fill in the body sections:
   - \`## ${changed}\`: short and non-technical, from the user's point of view.
   - \`## ${why}\`: the problem or request behind it.
   - \`## ${decisions}\`: bullet list of trade-offs and what was left out on purpose.
3. Screenshots help reviewers: save them in \`${dir}/media/\` and list them in the frontmatter, paths relative to \`${dir}/\`:
   \`\`\`yaml
   media:
     - before: media/<name>-before.png
       after: media/<name>-after.png
       caption: What to look at
     - image: media/<name>.png
     - video: media/<name>.webm
   \`\`\`
   Images: ${images}. Videos: ${videos}.
4. Run \`patchnotes check\` and fix every error it reports.

Do not add a \`status\` field (review status lives on the server), do not edit entries in released \`v*/\` directories, and do not run \`patchnotes release\` or \`patchnotes publish\` unless asked.
${END}`
}

export async function agentSnippetCommand(args: string[], io: Io): Promise<number | 'help'> {
  const { values, positionals } = parse(args, { write: { type: 'string' } })
  if (values.help) return 'help'
  if (positionals.length > 0) throw new UsageError(`unexpected argument "${positionals[0]}"`)

  const project = await loadProject(io.cwd)
  if (!project.ok) {
    printErrors(io, project.errors)
    return 1
  }
  const block = snippet(project.value.config.dir, project.value.config.language)
  if (values.write === undefined) {
    io.stdout(block)
    return 0
  }

  const file = resolve(io.cwd, values.write)
  let current: string | undefined
  try {
    current = await readFile(file, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (current === undefined) {
    await writeFile(file, `${block}\n`)
    io.stdout(`created ${values.write} with patch notes instructions`)
    return 0
  }
  const start = current.indexOf(START)
  const end = current.indexOf(END, start)
  if (start === -1 && current.includes(END)) {
    io.stderr(`${values.write}: found ${END} without ${START}, fix the markers first`)
    return 1
  }
  if (start !== -1 && end === -1) {
    io.stderr(`${values.write}: found ${START} without ${END}, fix the markers first`)
    return 1
  }
  if (start === -1) {
    await writeFile(file, `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${block}\n`)
    io.stdout(`added patch notes instructions to ${values.write}`)
    return 0
  }
  const next = current.slice(0, start) + block + current.slice(end + END.length)
  if (next !== current) await writeFile(file, next)
  io.stdout(`${next === current ? 'patch notes instructions already up to date in' : 'updated patch notes instructions in'} ${values.write}`)
  return 0
}
