import * as fs from 'node:fs/promises'
import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cli, entry, snapshot, tmpProject } from './test-utils.js'

vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>()
  return { ...actual, rename: vi.fn(actual.rename) }
})

const exists = (path: string) => access(path).then(() => true, () => false)
const files = (root: string, dir: string) => readdir(join(root, '.patchnotes', dir)).then((names) => names.sort())

const three = {
  '.patchnotes/unreleased/a.md': entry('a'),
  '.patchnotes/unreleased/b.md': entry('b'),
  '.patchnotes/unreleased/c.md': entry('c'),
}

afterEach(() => {
  vi.mocked(fs.rename).mockClear()
})

describe('patchnotes release', () => {
  it('moves all unreleased entries unchanged', async () => {
    const root = await tmpProject({ ...three, '.patchnotes/unreleased/.gitkeep': '', '.patchnotes/media/x.png': 'x' })
    const result = await cli(root, 'release', '1.4.0')
    expect(result).toEqual({ code: 0, stdout: 'released 1.4.0 on 2026-11-14: 3 entries moved to .patchnotes/v1.4.0', stderr: '' })
    expect(await files(root, 'v1.4.0')).toEqual(['a.md', 'b.md', 'c.md', 'release.yaml'])
    expect(await readFile(join(root, '.patchnotes/v1.4.0/release.yaml'), 'utf8')).toBe('date: 2026-11-14\n')
    expect(await files(root, 'unreleased')).toEqual(['.gitkeep'])
    expect(await readFile(join(root, '.patchnotes/v1.4.0/a.md'), 'utf8')).toBe(entry('a'))
    expect(await files(root, 'media')).toEqual(['x.png'])
    expect((await cli(root, 'check')).code).toBe(0)
  })

  it.each([
    ['minor', ['1.2.3', '1.10.0'], '1.11.0'],
    ['patch', ['1.2.3'], '1.2.4'],
    ['major', ['1.2.3'], '2.0.0'],
    ['minor', [], '0.1.0'],
  ])('bumps %s from %j to %s', async (bump, versions, expected) => {
    const released = Object.fromEntries(versions.map((v) => [`.patchnotes/v${v}/r${v.replaceAll('.', '')}.md`, entry(`r${v.replaceAll('.', '')}`)]))
    const root = await tmpProject({ ...released, '.patchnotes/unreleased/a.md': entry('a') })
    expect((await cli(root, 'release', bump)).code).toBe(0)
    expect(await files(root, `v${expected}`)).toEqual(['a.md', 'release.yaml'])
  })

  it.each([
    ['1.4.0', 1],
    ['1.3.9', 1],
    ['v1.5', 2],
  ])('rejects %s', async (version, code) => {
    const root = await tmpProject({ '.patchnotes/v1.4.0/old.md': entry('old'), '.patchnotes/unreleased/a.md': entry('a') })
    const before = await snapshot(root)
    const result = await cli(root, 'release', version)
    expect(result.code).toBe(code)
    if (code === 1) expect(result.stderr).toContain(version)
    expect(await snapshot(root)).toEqual(before)
  })

  it('records an explicit ship date', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a') })
    expect((await cli(root, 'release', 'patch', '--date', '2026-11-01')).code).toBe(0)
    expect(await readFile(join(root, '.patchnotes/v0.0.1/release.yaml'), 'utf8')).toBe('date: 2026-11-01\n')
  })

  it.each(['1.11.2026', '2026-02-30'])('rejects --date %s as usage error', async (date) => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a') })
    const before = await snapshot(root)
    expect((await cli(root, 'release', 'patch', '--date', date)).code).toBe(2)
    expect(await snapshot(root)).toEqual(before)
  })

  it('refuses when the check fails', async () => {
    const root = await tmpProject({
      '.patchnotes/v1.0.0/old.md': entry('old', 'media:\n  - image: media/gone.png\n'),
      '.patchnotes/unreleased/a.md': entry('a'),
    })
    const before = await snapshot(root)
    const result = await cli(root, 'release', 'patch')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('media file not found')
    expect(await snapshot(root)).toEqual(before)
  })

  it('refuses when nothing is unreleased', async () => {
    const root = await tmpProject({ '.patchnotes/v1.0.0/old.md': entry('old'), '.patchnotes/unreleased/.gitkeep': '' })
    const result = await cli(root, 'release', 'patch')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('nothing to release')
    expect(await exists(join(root, '.patchnotes/v1.0.1'))).toBe(false)
  })

  it('rolls back when a move fails midway', async () => {
    const root = await tmpProject(three)
    vi.mocked(fs.rename).mockImplementationOnce(vi.mocked(fs.rename).getMockImplementation()!).mockRejectedValueOnce(new Error('disk full'))
    const result = await cli(root, 'release', '1.0.0')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('disk full')
    expect(await files(root, 'unreleased')).toEqual(['a.md', 'b.md', 'c.md'])
    expect(await exists(join(root, '.patchnotes/v1.0.0'))).toBe(false)
  })
})
