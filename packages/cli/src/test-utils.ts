import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { onTestFinished } from 'vitest'
import { run } from './run.js'

export async function tmpProject(files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'patchnotes-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  await writeFiles(root, files)
  return root
}

export async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
}

export async function cli(cwd: string, ...argv: string[]) {
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await run(argv, {
    cwd,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
    now: () => new Date(2026, 10, 14, 12),
  })
  return { code, stdout: stdout.join('\n'), stderr: stderr.join('\n') }
}

export const entry = (id: string, extra = '') => `---\nid: ${id}\ntitle: Title ${id}\ntype: feature\ndate: 2026-11-14\n${extra}---\nBody\n`

/** Snapshot of every file under `dir` as path -> content. */
export async function snapshot(dir: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const d of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (d.isFile()) result[join(d.parentPath, d.name)] = await readFile(join(d.parentPath, d.name), 'utf8')
  }
  return result
}
