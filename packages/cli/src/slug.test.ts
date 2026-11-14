import { expect, it } from 'vitest'
import { slugify } from './slug.js'

it.each([
  ['Invoice export as CSV', 'invoice-export-as-csv'],
  ['Übersicht: Rechnungen & Gutschriften!', 'ubersicht-rechnungen-gutschriften'],
  ['Straße & Maße', 'strasse-masse'],
  ['  --Already--kebab--  ', 'already-kebab'],
  ['!!!', ''],
])('slugify(%j) = %j', (title, slug) => {
  expect(slugify(title)).toBe(slug)
})

it('cuts to 80 characters without a trailing dash', () => {
  const slug = slugify(`${'a'.repeat(79)} b`)
  expect(slug).toBe('a'.repeat(79))
  expect(slugify('word '.repeat(30)).length).toBeLessThanOrEqual(80)
})
