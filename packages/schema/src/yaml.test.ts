import { describe, expect, it } from 'vitest'
import { splitFrontmatter } from './yaml.js'

describe('splitFrontmatter', () => {
  it('splits data and body', () => {
    expect(splitFrontmatter('---\ntitle: A\n---\n## Body\n', 'a.md')).toEqual({
      ok: true,
      value: { data: { title: 'A' }, body: '## Body\n' },
    })
  })

  it('accepts an empty body', () => {
    expect(splitFrontmatter('---\ntitle: A\n---', 'a.md')).toEqual({ ok: true, value: { data: { title: 'A' }, body: '' } })
  })

  it('fails on missing frontmatter', () => {
    const result = splitFrontmatter('# Title\n---\ntitle: A\n---\n', 'a.md')
    expect(result).toEqual({ ok: false, errors: [{ file: 'a.md', message: expect.stringContaining('missing frontmatter') }] })
  })

  it('includes the YAML error message on malformed YAML', () => {
    const result = splitFrontmatter('---\ntitle: [unclosed\n---\n', 'a.md')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]?.message).toMatch(/^invalid YAML: .+/)
    expect(result.errors[0]?.file).toBe('a.md')
  })
})
