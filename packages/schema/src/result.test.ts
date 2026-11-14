import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validate } from './result.js'

describe('validate', () => {
  const schema = z.strictObject({ name: z.string(), nested: z.strictObject({ n: z.number() }) })

  it('reports every issue with field paths and names unknown keys', () => {
    const result = validate(schema, { nested: { n: 'x', extra: 1 }, typo: true }, 'a.md')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { file: 'a.md', field: 'name', message: 'required' },
        expect.objectContaining({ file: 'a.md', field: 'nested.n' }),
        { file: 'a.md', field: 'nested.extra', message: 'unknown field "extra"' },
        { file: 'a.md', field: 'typo', message: 'unknown field "typo"' },
      ]),
    )
    expect(result.errors).toHaveLength(4)
  })

  it('returns typed data on success', () => {
    expect(validate(schema, { name: 'a', nested: { n: 1 } }, 'a.md')).toEqual({
      ok: true,
      value: { name: 'a', nested: { n: 1 } },
    })
  })
})
