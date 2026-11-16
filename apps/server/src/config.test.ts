import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { loadConfig } from './config.js'

it('requires BASE_URL', () => {
  expect(loadConfig({})).toEqual({ ok: false, errors: ['BASE_URL: required'] })
  expect(loadConfig({ BASE_URL: '' })).toEqual({ ok: false, errors: ['BASE_URL: required'] })
})

it('names every invalid variable', () => {
  const result = loadConfig({ BASE_URL: 'example.com', PORT: 'abc' })
  expect(!result.ok && result.errors.map((e) => e.split(':')[0])).toEqual(['PORT', 'BASE_URL'])
})

it('applies defaults', () => {
  expect(loadConfig({ BASE_URL: 'https://notes.example.com/' })).toEqual({
    ok: true,
    value: { dataDir: resolve('./data'), port: 3000, host: '0.0.0.0', baseUrl: 'https://notes.example.com', language: 'en' },
  })
})

it('rejects a short AUTH_SECRET', () => {
  const result = loadConfig({ BASE_URL: 'https://x.example.com', AUTH_SECRET: 'short' })
  expect(!result.ok && result.errors[0]).toMatch(/^AUTH_SECRET: /)
})

it('rejects a short PUBLISH_TOKEN', () => {
  const result = loadConfig({ BASE_URL: 'https://x.example.com', PUBLISH_TOKEN: 'short' })
  expect(!result.ok && result.errors[0]).toMatch(/^PUBLISH_TOKEN: /)
})

it('accepts German and rejects unsupported languages', () => {
  expect(loadConfig({ BASE_URL: 'https://x.example.com', LANGUAGE: 'de' })).toMatchObject({ ok: true, value: { language: 'de' } })
  const result = loadConfig({ BASE_URL: 'https://x.example.com', LANGUAGE: 'fr' })
  expect(!result.ok && result.errors[0]).toMatch(/^LANGUAGE: /)
})
