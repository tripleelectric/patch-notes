import { access, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { cli, entry, tmpProject, writeFiles } from './test-utils.js'

const exists = (path: string) => access(path).then(() => true, () => false)

describe('help, version and exit codes', () => {
  it('prints help to stdout', async () => {
    const result = await cli(await tmpProject(), '--help')
    expect(result.code).toBe(0)
    expect(result.stdout).toMatch(/new <title>[\s\S]*check[\s\S]*release/)
  })

  it('prints help for a command', async () => {
    expect((await cli(await tmpProject(), 'check', '--help')).code).toBe(0)
  })

  it('prints usage to stderr without arguments', async () => {
    const result = await cli(await tmpProject())
    expect(result).toMatchObject({ code: 2, stdout: '' })
    expect(result.stderr).toContain('Usage: patchnotes')
  })

  it('prints the version', async () => {
    expect(await cli(await tmpProject(), '--version')).toEqual({ code: 0, stdout: pkg.version, stderr: '' })
  })

  it('rejects an unknown command', async () => {
    const result = await cli(await tmpProject(), 'frobnicate')
    expect(result.code).toBe(2)
    expect(result.stderr).toContain('Usage: patchnotes')
  })

  it('rejects an unknown option', async () => {
    const result = await cli(await tmpProject(), 'check', '--fast')
    expect(result.code).toBe(2)
    expect(result.stderr).toContain('--fast')
  })
})

describe('project root discovery', () => {
  it('uses the nearest patchnotes.yaml', async () => {
    const root = await tmpProject({ 'app/patchnotes.yaml': 'dir: notes\n', 'app/.git/HEAD': '' })
    await mkdir(join(root, 'app/src'))
    const result = await cli(join(root, 'app/src'), 'new', 'Hello', '--type', 'fix')
    expect(result).toEqual({ code: 0, stdout: 'notes/unreleased/hello.md', stderr: '' })
    expect(await exists(join(root, 'app/notes/unreleased/hello.md'))).toBe(true)
  })

  it.each([
    ['directory', { 'repo/.git/HEAD': '' }],
    ['worktree file', { 'repo/.git': 'gitdir: /elsewhere\n' }],
  ])('falls back to the git root (%s)', async (_, files) => {
    const root = await tmpProject(files)
    await mkdir(join(root, 'repo/packages/web'), { recursive: true })
    expect((await cli(join(root, 'repo/packages/web'), 'new', 'Hello', '--type', 'fix')).code).toBe(0)
    expect(await exists(join(root, 'repo/.patchnotes/unreleased/hello.md'))).toBe(true)
  })

  it('falls back to the working directory', async () => {
    const root = await tmpProject()
    expect((await cli(root, 'new', 'Hello', '--type', 'fix')).code).toBe(0)
    expect(await exists(join(root, '.patchnotes/unreleased/hello.md'))).toBe(true)
  })
})

describe('invalid config', () => {
  it.each([['check'], ['new', 'Hello', '--type', 'fix'], ['release', 'patch']])('stops %s', async (...argv) => {
    const root = await tmpProject({ 'patchnotes.yaml': 'sever: https://x.example.com\n' })
    await writeFiles(root, { '.patchnotes/unreleased/a.md': entry('a') })
    const result = await cli(root, ...argv)
    expect(result.code).toBe(1)
    expect(result.stderr).toBe('patchnotes.yaml: sever: unknown field "sever"')
    expect(await exists(join(root, '.patchnotes/unreleased/hello.md'))).toBe(false)
    expect(await exists(join(root, '.patchnotes/v0.0.1'))).toBe(false)
  })
})

describe('error output', () => {
  it('prints path relative to the project root, field and message', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a').replace('feature', 'bugfix') })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(/^\.patchnotes\/unreleased\/a\.md: type: /)
  })
})
