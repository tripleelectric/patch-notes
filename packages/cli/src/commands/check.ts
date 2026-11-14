import { check } from '../check.js'
import { parse, UsageError, type Io } from '../io.js'
import { loadProject, printErrors } from '../project.js'

export async function checkCommand(args: string[], io: Io): Promise<number | 'help'> {
  const { values, positionals } = parse(args, {})
  if (values.help) return 'help'
  if (positionals.length > 0) throw new UsageError(`unexpected argument "${positionals[0]}"`)

  const project = await loadProject(io.cwd)
  if (!project.ok) {
    printErrors(io, project.errors)
    return 1
  }
  const { entries, errors } = await check(project.value)
  if (errors.length > 0) {
    printErrors(io, errors)
    return 1
  }
  io.stdout(`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} valid`)
  return 0
}
