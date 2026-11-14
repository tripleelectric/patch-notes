import { parse } from 'yaml'
import type { Result } from './result.js'

export function parseYaml(text: string, file: string): Result<unknown> {
  try {
    return { ok: true, value: parse(text) ?? {} }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, errors: [{ file, message: `invalid YAML: ${message}` }] }
  }
}

const FRONTMATTER = /^﻿?---[ \t]*\r?\n([\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/

export function splitFrontmatter(content: string, file: string): Result<{ data: unknown; body: string }> {
  const match = FRONTMATTER.exec(content)
  if (!match) {
    return { ok: false, errors: [{ file, message: 'missing frontmatter: file must start with a "---" block' }] }
  }
  const data = parseYaml(match[1] ?? '', file)
  if (!data.ok) return data
  return { ok: true, value: { data: data.value, body: content.slice(match[0].length) } }
}
