import { mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cli, entry, snapshot, tmpProject } from './test-utils.js'

const media = (path: string) => `media:\n  - image: ${path}\n`

describe('patchnotes check', () => {
  it('reports the number of valid entries', async () => {
    const root = await tmpProject({
      '.patchnotes/unreleased/a.md': entry('a', media('media/a.png')),
      '.patchnotes/v1.0.0/b.md': entry('b'),
      '.patchnotes/media/a.png': 'png',
      '.patchnotes/media/notes.md': 'not an entry',
      '.patchnotes/unreleased/.gitkeep': '',
    })
    expect(await cli(root, 'check')).toEqual({ code: 0, stdout: '2 entries valid', stderr: '' })
  })

  it('reports errors of all files', async () => {
    const root = await tmpProject({
      '.patchnotes/unreleased/a.md': entry('a').replace('feature', 'bugfix'),
      '.patchnotes/v1.0.0/b.md': entry('b').replace('title: Title b\n', ''),
    })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr.split('\n')).toEqual([
      expect.stringMatching(/^\.patchnotes\/unreleased\/a\.md: type: /),
      '.patchnotes/v1.0.0/b.md: title: required',
    ])
  })

  it('names an unknown directory', async () => {
    const root = await tmpProject({ '.patchnotes/next/a.md': entry('a') })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('.patchnotes/next/a.md: unknown directory "next"')
  })

  it('names both paths of a duplicate id', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a'), '.patchnotes/v1.0.0/a.md': entry('a') })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('.patchnotes/v1.0.0/a.md')
    expect(result.stderr).toContain('.patchnotes/unreleased/a.md')
  })

  it('reports a missing media file', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', media('media/a.png')) })
    const result = await cli(root, 'check')
    expect(result).toMatchObject({ code: 1, stderr: '.patchnotes/unreleased/a.md: media.0.image: media file not found: media/a.png' })
  })

  it('rejects a symbolic link leaving the directory', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', media('media/a.png')), 'secret.png': 'x' })
    await mkdir(join(root, '.patchnotes/media'))
    await symlink(join(root, 'secret.png'), join(root, '.patchnotes/media/a.png'))
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('path must stay inside the patch notes directory')
  })

  it('rejects a directory as media', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', media('media/shot.png')), '.patchnotes/media/shot.png/x': 'x' })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('media path is not a file')
  })

  it('requires appUrl for a path try link', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', 'try: /invoices\n') })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(/^\.patchnotes\/unreleased\/a\.md: try: .*appUrl/)
  })

  it('accepts a path try link with appUrl', async () => {
    const root = await tmpProject({
      'patchnotes.yaml': 'appUrl: https://app.example.com\n',
      '.patchnotes/unreleased/a.md': entry('a', 'try: /invoices\n'),
    })
    expect((await cli(root, 'check')).code).toBe(0)
  })

  it('accepts an absolute try link without appUrl', async () => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', 'try: https://app.example.com/invoices\n') })
    expect((await cli(root, 'check')).code).toBe(0)
  })

  it('fails on a missing directory', async () => {
    const result = await cli(await tmpProject(), 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(/^\.patchnotes: .*patchnotes new/)
  })

  it('uses the configured dir in paths', async () => {
    const root = await tmpProject({ 'patchnotes.yaml': 'dir: ./docs/notes\n', 'docs/notes/unreleased/a.md': entry('b') })
    expect((await cli(root, 'check')).stderr).toMatch(/^docs\/notes\/unreleased\/a\.md: id: /)
  })

  it.each([
    ['media/logo.svg', 'unsupported media type'],
    ['media/flow.webm', 'must be an image'],
  ])('rejects image %s', async (path, message) => {
    const root = await tmpProject({ '.patchnotes/unreleased/a.md': entry('a', media(path)), [`.patchnotes/${path}`]: 'x' })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(new RegExp(`^\\.patchnotes/unreleased/a\\.md: media\\.0\\.image: .*${message}`))
  })

  it('validates release files', async () => {
    const root = await tmpProject({
      '.patchnotes/v1.0.0/a.md': entry('a'),
      '.patchnotes/v1.0.0/release.yaml': 'date: tomorrow\n',
      '.patchnotes/unreleased/release.yaml': 'date: 2026-11-14\n',
    })
    const result = await cli(root, 'check')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('.patchnotes/v1.0.0/release.yaml: date: ')
    expect(result.stderr).toContain('.patchnotes/unreleased/release.yaml: release.yaml belongs directly in a version directory')
  })

  it('accepts a valid release file', async () => {
    const root = await tmpProject({ '.patchnotes/v1.0.0/a.md': entry('a'), '.patchnotes/v1.0.0/release.yaml': 'date: 2026-10-15\n' })
    expect((await cli(root, 'check')).code).toBe(0)
  })

  it('changes no file', async () => {
    const root = await tmpProject({
      '.patchnotes/unreleased/a.md': entry('a', media('media/a.png')),
      '.patchnotes/next/b.md': entry('b'),
    })
    const before = await snapshot(root)
    expect((await cli(root, 'check')).code).toBe(1)
    expect(await snapshot(root)).toEqual(before)
  })
})
