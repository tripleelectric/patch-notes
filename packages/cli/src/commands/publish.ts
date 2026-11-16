import { createHash } from 'node:crypto'
import { createReadStream, openAsBlob } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { mediaPaths, mediaType, type PublishedEntry, type PublishedMedia, type PublishResult } from '@patch-notes/schema'
import { check } from '../check.js'
import { parse, UsageError, type Io } from '../io.js'
import { loadProject, printErrors } from '../project.js'

class PublishError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message)
  }
}

async function sha256Of(path: string): Promise<string> {
  const hash = createHash('sha256')
  await pipeline(createReadStream(path), hash)
  return hash.digest('hex')
}

export async function publishCommand(args: string[], io: Io): Promise<number | 'help'> {
  const { values, positionals } = parse(args, {})
  if (values.help) return 'help'
  if (positionals.length > 0) throw new UsageError(`unexpected argument "${positionals[0]}"`)

  const project = await loadProject(io.cwd)
  if (!project.ok) {
    printErrors(io, project.errors)
    return 1
  }
  const { dir, config } = project.value
  if (!config.server) {
    io.stderr('no server configured: set "server" in patchnotes.yaml')
    return 1
  }
  const token = io.env.PATCHNOTES_TOKEN
  if (!token) {
    io.stderr('no token: set the PATCHNOTES_TOKEN environment variable')
    return 1
  }
  const { entries, releases, errors } = await check(project.value)
  if (errors.length > 0) {
    printErrors(io, errors)
    return 1
  }

  const server = config.server.replace(/\/+$/, '')
  const files = new Map<string, PublishedMedia>()
  const payloadEntries: PublishedEntry[] = []
  for (const entry of entries) {
    const media: PublishedMedia[] = []
    for (const item of entry.data.media ?? []) {
      for (const [, path] of mediaPaths(item)) {
        let file = files.get(path)
        if (!file) {
          const blob = await openAsBlob(join(dir, path))
          file = { path, sha256: await sha256Of(join(dir, path)), size: blob.size, contentType: mediaType(path)!.contentType }
          files.set(path, file)
        }
        if (!media.some((m) => m.path === path)) media.push(file)
      }
    }
    payloadEntries.push({ path: entry.path, version: entry.version, data: entry.data, body: entry.body, media })
  }

  async function call(path: string, init: RequestInit): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(`${server}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, ...init.headers } })
    } catch (error) {
      const cause = error instanceof Error ? ((error.cause as Error | undefined)?.message ?? error.message) : String(error)
      throw new PublishError(`cannot reach ${server}: ${cause}`)
    }
    const body = (await response.json().catch(() => undefined)) as { error?: string; details?: unknown } | undefined
    if (response.ok) return body
    if (response.status === 401) throw new PublishError(`the server rejected PATCHNOTES_TOKEN (${server})`)
    const details = Array.isArray(body?.details)
      ? body.details.map((d: { entry?: string; field?: string; message?: string }) =>
          [d.entry && `${config.dir}/${d.entry}`, d.field, d.message].filter(Boolean).join(': '),
        )
      : []
    throw new PublishError(`server error ${response.status}: ${body?.error ?? response.statusText}`, details)
  }

  try {
    const unique = [...new Map([...files.values()].map((f) => [f.sha256, f])).values()]
    const { missing } = (await call('/api/media/missing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hashes: unique.map((f) => f.sha256) }),
    })) as { missing: string[] }
    const missingSet = new Set(missing)
    let uploaded = 0
    for (const file of unique.filter((f) => missingSet.has(f.sha256))) {
      await call(`/api/media/${file.sha256}`, {
        method: 'PUT',
        headers: { 'content-type': file.contentType },
        body: await openAsBlob(join(dir, file.path)),
      })
      uploaded++
    }
    const result = (await call('/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entries: payloadEntries, releases, ...(config.appUrl && { appUrl: config.appUrl }) }),
    })) as PublishResult
    io.stdout(
      `published to ${server}: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged, ` +
        `${result.removed} removed; ${uploaded} media ${uploaded === 1 ? 'file' : 'files'} uploaded`,
    )
    return 0
  } catch (error) {
    if (!(error instanceof PublishError)) throw error
    io.stderr(error.message)
    for (const line of error.details) io.stderr(`  ${line}`)
    return 1
  }
}
