import { expect, it } from 'vitest'
import { nextVersion } from './version.js'

it.each([
  ['patch', ['1.2.3'], '1.2.4'],
  ['minor', ['1.2.3', '1.10.0'], '1.11.0'],
  ['major', ['1.2.3'], '2.0.0'],
  ['minor', [], '0.1.0'],
  ['patch', [], '0.0.1'],
  ['1.5.0', ['1.4.0'], '1.5.0'],
  ['1.0.0', [], '1.0.0'],
])('%s after %j is %s', (arg, existing, expected) => {
  expect(nextVersion(arg, existing)).toEqual({ ok: true, value: expected })
})

it.each([
  ['1.4.0', ['1.4.0']],
  ['1.3.9', ['1.4.0']],
  ['1.9.0', ['1.10.0']],
])('rejects %s after %j', (arg, existing) => {
  const result = nextVersion(arg, existing)
  expect(result.ok).toBe(false)
  expect(!result.ok && result.message).toContain(arg)
})
