import { describe, expect, it } from 'vitest'
import { parseConfig } from './config.js'

const fields = (content: string) => {
  const result = parseConfig(content)
  if (result.ok) throw new Error('expected failure')
  return result.errors.map((e) => e.field)
}

describe('parseConfig', () => {
  it('returns typed config', () => {
    expect(parseConfig('server: https://patchnotes.example.com\ndir: notes\nappUrl: https://app.example.com\n')).toEqual({
      ok: true,
      value: { server: 'https://patchnotes.example.com', dir: 'notes', appUrl: 'https://app.example.com', language: 'en' },
    })
  })

  it('includes the YAML error on malformed YAML', () => {
    const result = parseConfig('server: [x\n')
    expect(!result.ok && result.errors[0]).toEqual({ file: 'patchnotes.yaml', message: expect.stringMatching(/^invalid YAML: /) })
  })

  it.each(['', '# only a comment\n'])('yields defaults for empty file %j', (content) => {
    expect(parseConfig(content)).toEqual({ ok: true, value: { dir: '.patchnotes', language: 'en' } })
  })

  it('names an invalid server URL', () => {
    expect(fields('server: patchnotes.example.com')).toEqual(['server'])
  })

  it('names an invalid appUrl', () => {
    expect(fields('appUrl: ftp://app.example.com')).toEqual(['appUrl'])
  })

  it.each(['../notes', '/abs/notes', 'a/../../b'])('names dir %s escaping the project', (dir) => {
    expect(fields(`dir: ${dir}`)).toEqual(['dir'])
  })

  it('names an unknown field', () => {
    const result = parseConfig('sever: https://x.example.com')
    expect(!result.ok && result.errors).toEqual([{ file: 'patchnotes.yaml', field: 'sever', message: 'unknown field "sever"' }])
  })

  it('rejects a token with a pointer to the environment variable', () => {
    const result = parseConfig('token: secret')
    expect(!result.ok && result.errors).toEqual([
      { file: 'patchnotes.yaml', field: 'token', message: expect.stringContaining('PATCHNOTES_TOKEN') },
    ])
  })

  it('accepts German and rejects unsupported languages', () => {
    expect(parseConfig('language: de').ok && parseConfig('language: de')).toMatchObject({ value: { language: 'de' } })
    expect(fields('language: fr')).toEqual(['language'])
  })

  it('rejects a non-object document', () => {
    expect(parseConfig('- a\n- b\n').ok).toBe(false)
  })
})
