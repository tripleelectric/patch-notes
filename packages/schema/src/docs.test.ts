import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { parseConfig, parseEntry } from './index.js'

const doc = readFileSync(new URL('../../../docs/entry-format.md', import.meta.url), 'utf8')
const block = (lang: string) => {
  const match = new RegExp(`^\`\`\`${lang}\\n([\\s\\S]*?)^\`\`\`$`, 'm').exec(doc)
  if (!match?.[1]) throw new Error(`no ${lang} block in docs/entry-format.md`)
  return match[1]
}

it('documented example entry parses', () => {
  const result = parseEntry(block('md'), 'unreleased/invoice-export.md')
  expect(result.ok ? [] : result.errors).toEqual([])
})

it('documented example config parses', () => {
  const result = parseConfig(block('yaml'))
  expect(result.ok ? [] : result.errors).toEqual([])
})
