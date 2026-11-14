import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { entry, tmpProject, writeFiles } from './test-utils.js'

const exec = promisify(execFile)

it('builds a self-contained executable', { timeout: 30_000 }, async () => {
  const root = await tmpProject()
  const bin = join(root, 'bin/patchnotes.js')
  await exec(process.execPath, ['build.mjs', bin], { cwd: join(import.meta.dirname, '..') })

  const project = join(root, 'project')
  await mkdir(project)
  await writeFiles(project, { '.patchnotes/unreleased/a.md': entry('a') })
  expect((await exec(process.execPath, [bin, '--version'], { cwd: project })).stdout).toBe(`${pkg.version}\n`)
  expect((await exec(process.execPath, [bin, 'check'], { cwd: project })).stdout).toBe('1 entry valid\n')
})
