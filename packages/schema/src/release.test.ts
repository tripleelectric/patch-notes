import { expect, it } from 'vitest'
import { parseRelease } from './release.js'

it('parses a release date', () => {
  expect(parseRelease('date: 2026-11-14\n', 'v1.4.0/release.yaml')).toEqual({ ok: true, value: { date: '2026-11-14' } })
})

it.each(['date: 2026-02-30', 'date: tomorrow', ''])('rejects %j naming the date field', (content) => {
  const result = parseRelease(content, 'v1.4.0/release.yaml')
  expect(!result.ok && result.errors).toEqual([expect.objectContaining({ file: 'v1.4.0/release.yaml', field: 'date' })])
})

it('rejects unknown fields', () => {
  const result = parseRelease('date: 2026-11-14\ntitle: Winter\n', 'v1.4.0/release.yaml')
  expect(!result.ok && result.errors.map((e) => e.field)).toEqual(['title'])
})
