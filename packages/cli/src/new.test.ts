import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cli, entry, snapshot, tmpProject } from './test-utils.js'

const exists = (path: string) => access(path).then(() => true, () => false)

describe('patchnotes new', () => {
  it('creates a valid entry', async () => {
    const root = await tmpProject()
    const result = await cli(root, 'new', 'Invoice export as CSV', '--type', 'feature')
    expect(result).toEqual({ code: 0, stdout: '.patchnotes/unreleased/invoice-export-as-csv.md', stderr: '' })
    expect(await readFile(join(root, result.stdout), 'utf8')).toBe(
      '---\nid: invoice-export-as-csv\ntitle: Invoice export as CSV\ntype: feature\ndate: 2026-11-14\n---\n\n' +
        '## What changed\n\n## Why\n\n## Decisions\n',
    )
    expect(await cli(root, 'check')).toMatchObject({ code: 0, stdout: '1 entry valid' })
  })

  it('requires --type', async () => {
    const root = await tmpProject()
    expect((await cli(root, 'new', 'Invoice export')).code).toBe(2)
    expect(await exists(join(root, '.patchnotes'))).toBe(false)
  })

  it('rejects an invalid --type and lists the allowed ones', async () => {
    const root = await tmpProject()
    const result = await cli(root, 'new', 'Invoice export', '--type', 'bugfix')
    expect(result.code).toBe(2)
    expect(result.stderr).toContain('feature, fix, change')
    expect(await exists(join(root, '.patchnotes'))).toBe(false)
  })

  it('uses an explicit id', async () => {
    const root = await tmpProject()
    expect((await cli(root, 'new', 'Invoice export', '--type', 'fix', '--id', 'csv-export')).stdout).toBe(
      '.patchnotes/unreleased/csv-export.md',
    )
    expect(await readFile(join(root, '.patchnotes/unreleased/csv-export.md'), 'utf8')).toContain('id: csv-export\n')
  })

  it('asks for --id when the title has no usable characters', async () => {
    const root = await tmpProject()
    const result = await cli(root, 'new', '!!!', '--type', 'fix')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('--id')
    expect(await exists(join(root, '.patchnotes'))).toBe(false)
  })

  it('sets requests in order and the try link', async () => {
    const root = await tmpProject({ 'patchnotes.yaml': 'appUrl: https://app.example.com\n' })
    const result = await cli(root, 'new', 'A', '--type', 'change', '--request', 'https://a.example.com/1', '--request', 'https://b.example.com/2', '--try', '/invoices')
    expect(await readFile(join(root, result.stdout), 'utf8')).toContain(
      'requests:\n  - https://a.example.com/1\n  - https://b.example.com/2\ntry: /invoices\n',
    )
    expect((await cli(root, 'check')).code).toBe(0)
  })

  it.each([
    [['--request', 'ASANA-123'], 'requests.0'],
    [['--id', 'Bad Id'], 'id'],
  ])('writes nothing on invalid input %j', async (flags, field) => {
    const root = await tmpProject()
    const result = await cli(root, 'new', 'A', '--type', 'fix', ...flags)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain(`: ${field}: `)
    expect(await exists(join(root, '.patchnotes'))).toBe(false)
  })

  it('writes nothing for a too long title', async () => {
    const root = await tmpProject()
    const result = await cli(root, 'new', 'x'.repeat(121), '--type', 'fix')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain(': title: ')
    expect(await exists(join(root, '.patchnotes'))).toBe(false)
  })

  it('refuses an id that already exists in a release', async () => {
    const root = await tmpProject({ '.patchnotes/v1.0.0/invoice-export.md': entry('invoice-export') })
    const before = await snapshot(root)
    const result = await cli(root, 'new', 'Invoice export', '--type', 'fix')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('.patchnotes/v1.0.0/invoice-export.md')
    expect(await snapshot(root)).toEqual(before)
  })
})
