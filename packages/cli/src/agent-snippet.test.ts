import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { END, START } from './commands/agent-snippet.js'
import { cli, tmpProject } from './test-utils.js'

describe('patchnotes agent-snippet', () => {
  it('prints instructions for the default directory', async () => {
    const result = await cli(await tmpProject(), 'agent-snippet')
    expect(result.code).toBe(0)
    expect(result.stdout.startsWith(START)).toBe(true)
    expect(result.stdout.endsWith(END)).toBe(true)
    for (const text of ['.patchnotes/media/', 'feature|fix|change', '## What changed', '## Why', '## Decisions', 'patchnotes check', '.png', '.webm', '`status`', 'patchnotes release', 'patchnotes publish']) {
      expect(result.stdout).toContain(text)
    }
  })

  it('names the content language', async () => {
    const english = await cli(await tmpProject(), 'agent-snippet')
    expect(english.stdout).toContain('in English')
    const german = await cli(await tmpProject({ 'patchnotes.yaml': 'language: de\n' }), 'agent-snippet')
    expect(german.stdout).toContain('in German')
    expect(german.stdout).toContain('## Was hat sich geändert')
  })

  it('uses the configured directory', async () => {
    const result = await cli(await tmpProject({ 'patchnotes.yaml': 'dir: docs/notes\n' }), 'agent-snippet')
    expect(result.stdout).toContain('docs/notes/media/')
    expect(result.stdout).not.toContain('.patchnotes/')
  })

  it('appends to an existing file, then updates in place', async () => {
    const root = await tmpProject({ 'AGENTS.md': '# Agents\n\nUse pnpm.\n' })
    expect((await cli(root, 'agent-snippet', '--write', 'AGENTS.md')).stdout).toContain('added')
    const first = await readFile(join(root, 'AGENTS.md'), 'utf8')
    expect(first.startsWith('# Agents\n\nUse pnpm.\n\n<!-- patchnotes:start -->')).toBe(true)

    await writeFile(join(root, 'AGENTS.md'), `${first}\n## Later section\n`)
    const withLater = await readFile(join(root, 'AGENTS.md'), 'utf8')
    expect((await cli(root, 'agent-snippet', '--write', 'AGENTS.md')).stdout).toContain('already up to date')
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe(withLater)

    await writeFile(join(root, 'patchnotes.yaml'), 'dir: notes\n')
    expect((await cli(root, 'agent-snippet', '--write', 'AGENTS.md')).stdout).toContain('updated')
    const updated = await readFile(join(root, 'AGENTS.md'), 'utf8')
    expect(updated.split(START)).toHaveLength(2)
    expect(updated).toContain('notes/media/')
    expect(updated.endsWith('\n## Later section\n')).toBe(true)
  })

  it('creates a missing file', async () => {
    const root = await tmpProject()
    expect((await cli(root, 'agent-snippet', '--write', 'CLAUDE.md')).stdout).toContain('created')
    expect((await readFile(join(root, 'CLAUDE.md'), 'utf8')).startsWith(START)).toBe(true)
  })

  it('refuses broken markers', async () => {
    const content = `# Agents\n${START}\nhalf\n`
    const root = await tmpProject({ 'AGENTS.md': content })
    expect((await cli(root, 'agent-snippet', '--write', 'AGENTS.md')).code).toBe(1)
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe(content)
  })
})
