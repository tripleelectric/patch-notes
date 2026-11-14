import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { parseEntry, validateEntrySet, type Entry } from './entry.js'

const base = { id: 'invoice-export', title: 'Invoice export as CSV', type: 'feature', date: '2026-11-14' }
const PATH = 'unreleased/invoice-export.md'

function file(data: Record<string, unknown>, body = '## What changed\nCSV export.\n') {
  return `---\n${stringify(data)}---\n${body}`
}

function errorsOf(data: Record<string, unknown>, path = PATH) {
  const result = parseEntry(file(data), path)
  if (result.ok) throw new Error('expected failure')
  return result.errors
}

function valueOf(data: Record<string, unknown>, path = PATH) {
  const result = parseEntry(file(data), path)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}

const fields = (data: Record<string, unknown>, path?: string) => errorsOf(data, path).map((e) => e.field)

describe('entry structure', () => {
  it('returns typed fields and body', () => {
    expect(valueOf(base)).toEqual({ path: PATH, version: null, data: base, body: '## What changed\nCSV export.\n' })
  })

  it('fails on missing frontmatter', () => {
    expect(parseEntry('# Title\n', PATH)).toEqual({
      ok: false,
      errors: [{ file: PATH, message: expect.stringContaining('missing frontmatter') }],
    })
  })

  it('includes the YAML error on malformed YAML', () => {
    const result = parseEntry('---\ntitle: [x\n---\n', PATH)
    expect(!result.ok && result.errors[0]?.message).toMatch(/^invalid YAML: /)
  })
})

describe('required fields', () => {
  it('names a missing title', () => {
    const { title: _, ...rest } = base
    expect(errorsOf(rest)).toEqual([{ file: PATH, field: 'title', message: 'required' }])
  })

  it('names type and lists allowed values', () => {
    const [error] = errorsOf({ ...base, type: 'bugfix' })
    expect(error?.field).toBe('type')
    expect(error?.message).toMatch(/feature.*fix.*change/)
  })

  it.each(['2026-13-01', '2026-02-31', '14.11.2026'])('rejects date %s', (date) => {
    expect(fields({ ...base, date })).toEqual(['date'])
  })

  it('accepts a leap day', () => {
    expect(valueOf({ ...base, date: '2028-02-29' }).data.date).toBe('2028-02-29')
  })

  it('names an invalid id', () => {
    expect(fields({ ...base, id: 'Invoice Export' }, 'unreleased/Invoice Export.md')).toEqual(['id'])
  })

  it('reports all errors of one file together', () => {
    const { title: _, ...rest } = base
    expect(errorsOf({ ...rest, type: 'bugfix' })).toEqual([
      expect.objectContaining({ file: PATH, field: 'title' }),
      expect.objectContaining({ file: PATH, field: 'type' }),
    ])
  })
})

describe('id matches file name', () => {
  it('fails on mismatch', () => {
    expect(errorsOf({ ...base, id: 'csv-export' })).toEqual([
      { file: PATH, field: 'id', message: 'id "csv-export" differs from file name "invoice-export"' },
    ])
  })
})

describe('requests', () => {
  it('returns urls in order', () => {
    const requests = ['https://app.asana.com/0/1/2', 'https://github.com/o/r/issues/3']
    expect(valueOf({ ...base, requests }).data.requests).toEqual(requests)
  })

  it('rejects non-URL requests', () => {
    expect(fields({ ...base, requests: ['ASANA-123'] })).toEqual(['requests.0'])
  })

  it('rejects non-http URLs', () => {
    expect(fields({ ...base, requests: ['ftp://x.com/a'] })).toEqual(['requests.0'])
  })
})

describe('try', () => {
  it('accepts a path', () => {
    expect(valueOf({ ...base, try: '/invoices?export=1' }).data.try).toBe('/invoices?export=1')
  })

  it('accepts an absolute URL', () => {
    expect(valueOf({ ...base, try: 'https://app.example.com/x' }).data.try).toBe('https://app.example.com/x')
  })

  it.each(['invoices', '//evil.example.com'])('rejects %s', (value) => {
    expect(fields({ ...base, try: value })).toEqual(['try'])
  })
})

describe('media', () => {
  it('returns a before/after pair', () => {
    const media = [{ before: 'media/a.png', after: 'media/b.png', caption: 'Export button' }, { video: 'media/flow.webm' }]
    expect(valueOf({ ...base, media }).data.media).toEqual(media)
  })

  it('names the item index on an incomplete pair', () => {
    expect(fields({ ...base, media: [{ image: 'media/x.png' }, { before: 'media/a.png' }] })).toEqual(['media.1'])
  })

  it('rejects mixed kinds', () => {
    expect(fields({ ...base, media: [{ image: 'media/x.png', video: 'media/y.webm' }] })).toEqual(['media.0'])
  })

  it.each(['../secrets.png', '/etc/passwd', 'media/../../x.png', 'media\\x.png', 'C:/x.png'])('rejects path %s', (path) => {
    const [error, ...rest] = errorsOf({ ...base, media: [{ image: path }] })
    expect(rest).toEqual([])
    expect(error).toEqual({
      file: PATH,
      field: 'media.0.image',
      message: expect.stringContaining('must stay inside the patch notes directory'),
    })
  })
})

describe('unknown fields', () => {
  it('names a typo', () => {
    const { title, ...rest } = base
    expect(errorsOf({ ...rest, tittle: title })).toContainEqual({
      file: PATH,
      field: 'tittle',
      message: 'unknown field "tittle"',
    })
  })

  it('rejects review status', () => {
    expect(errorsOf({ ...base, status: 'accepted' })).toEqual([
      { file: PATH, field: 'status', message: 'unknown field "status"' },
    ])
  })
})

describe('directory layout', () => {
  it('resolves unreleased', () => {
    expect(valueOf(base).version).toBeNull()
  })

  it('resolves a released version', () => {
    expect(valueOf(base, 'v1.4.0/invoice-export.md').version).toBe('1.4.0')
  })

  it.each(['next/invoice-export.md', 'v1.4/invoice-export.md', 'invoice-export.md', 'unreleased/x/invoice-export.md'])(
    'rejects %s',
    (path) => {
      expect(errorsOf(base, path)[0]?.file).toBe(path)
    },
  )

  it('names the unknown directory', () => {
    expect(errorsOf(base, 'next/invoice-export.md')[0]?.message).toContain('"next"')
  })
})

describe('validateEntrySet', () => {
  const entry = (path: string): Entry => ({ path, version: null, data: { ...base, type: 'feature' }, body: '' })

  it('names both paths on a duplicate id', () => {
    const errors = validateEntrySet([entry('unreleased/invoice-export.md'), entry('v1.4.0/invoice-export.md')])
    expect(errors).toHaveLength(1)
    expect(errors[0]?.file).toBe('v1.4.0/invoice-export.md')
    expect(errors[0]?.message).toContain('unreleased/invoice-export.md')
  })

  it('accepts unique ids', () => {
    expect(validateEntrySet([entry('unreleased/invoice-export.md')])).toEqual([])
  })
})
