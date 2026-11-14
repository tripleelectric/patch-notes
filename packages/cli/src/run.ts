import pkg from '../package.json' with { type: 'json' }
import { checkCommand } from './commands/check.js'
import { newCommand } from './commands/new.js'
import { releaseCommand } from './commands/release.js'
import { UsageError, type Io } from './io.js'

export const USAGE = `Usage: patchnotes <command> [options]

Commands:
  new <title> --type <feature|fix|change> [--id <id>] [--request <url>]... [--try <link>]
      Create an entry in unreleased/.
  check
      Validate all entries, ids and media files.
  release <patch|minor|major|X.Y.Z>
      Move all unreleased entries into a version directory.

Options:
  -h, --help     Show this help.
  -v, --version  Show the version.

Exit codes: 0 success, 1 validation or operation failed, 2 invalid usage.`

const commands = { new: newCommand, check: checkCommand, release: releaseCommand }

export async function run(argv: string[], io: Io): Promise<number> {
  const [name, ...rest] = argv
  if (name === undefined) {
    io.stderr(USAGE)
    return 2
  }
  if (name === '-h' || name === '--help') {
    io.stdout(USAGE)
    return 0
  }
  if (name === '-v' || name === '--version') {
    io.stdout(pkg.version)
    return 0
  }
  if (!Object.hasOwn(commands, name)) {
    io.stderr(`unknown command "${name}"\n\n${USAGE}`)
    return 2
  }
  try {
    const result = await commands[name as keyof typeof commands](rest, io)
    if (result === 'help') io.stdout(USAGE)
    return result === 'help' ? 0 : result
  } catch (error) {
    if (!(error instanceof UsageError)) throw error
    io.stderr(`${error.message}\n\nRun "patchnotes --help" for usage.`)
    return 2
  }
}
