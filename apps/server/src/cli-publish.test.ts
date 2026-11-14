import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { run } from '@patch-notes/cli/run'
import { describe, expect, it } from 'vitest'
import { testApp, tmpDir } from './test-utils.js'

const TOKEN = 'p'.repeat(40)
const PNG = Buffer.from('89504e470d0a1a0a0000', 'hex')
const entry = (id: string, extra = '') => `---\nid: ${id}\ntitle: Title ${id}\ntype: feature\ndate: 2026-11-14\n${extra}---\nBody ${id}\n`

async function project(server: string | undefined, files: Record<string, string | Buffer>) {
  const root = await tmpDir()
  const all = { 'patchnotes.yaml': server ? `server: ${server}\nappUrl: https://app.example.com\n` : '', ...files }
  for (const [path, content] of Object.entries(all)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
  return root
}

async function publish(cwd: string, env: Record<string, string> = { PATCHNOTES_TOKEN: TOKEN }) {
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await run(['publish'], { cwd, env, now: () => new Date(), stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l) })
  return { code, stdout: stdout.join('\n'), stderr: stderr.join('\n') }
}

async function listening() {
  const app = await testApp({ publishToken: TOKEN })
  const address = await app.listen({ port: 0, host: '127.0.0.1' })
  return { app, url: address }
}

const twoEntries = {
  '.patchnotes/unreleased/a.md': entry('a', 'media:\n  - image: media/a.png\n'),
  '.patchnotes/v1.0.0/b.md': entry('b', 'try: /b\n'),
  '.patchnotes/media/a.png': PNG,
}

describe('patchnotes publish', () => {
  it('publishes entries and media, then reports no changes', async () => {
    const { app, url } = await listening()
    const root = await project(url, twoEntries)

    const first = await publish(root)
    expect(first).toEqual({
      code: 0,
      stdout: `published to ${url}: 2 created, 0 updated, 0 unchanged, 0 removed; 1 media file uploaded`,
      stderr: '',
    })
    expect(await app.prisma.entry.findUniqueOrThrow({ where: { id: 'b' } })).toMatchObject({ version: '1.0.0', try: '/b' })
    expect((await app.prisma.setting.findUniqueOrThrow({ where: { key: 'appUrl' } })).value).toBe('https://app.example.com')

    expect((await publish(root)).stdout).toContain('0 created, 0 updated, 2 unchanged, 0 removed; 0 media files uploaded')
  })

  it('requires PATCHNOTES_TOKEN', async () => {
    const result = await publish(await project('http://127.0.0.1:9', twoEntries), {})
    expect(result).toMatchObject({ code: 1 })
    expect(result.stderr).toContain('PATCHNOTES_TOKEN')
  })

  it('requires a server', async () => {
    const result = await publish(await project(undefined, twoEntries))
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(/server.*patchnotes\.yaml/)
  })

  it('sends nothing when check fails', async () => {
    const { app, url } = await listening()
    const root = await project(url, { '.patchnotes/unreleased/a.md': entry('a', 'media:\n  - image: media/gone.png\n') })
    expect((await publish(root)).code).toBe(1)
    expect(await app.prisma.entry.count()).toBe(0)
  })

  it('reports a rejected token without printing it', async () => {
    const { url } = await listening()
    const result = await publish(await project(url, twoEntries), { PATCHNOTES_TOKEN: 'wrong-token-value' })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('rejected PATCHNOTES_TOKEN')
    expect(result.stderr).not.toContain('wrong-token-value')
  })

  it('reports an unreachable server', async () => {
    const result = await publish(await project('http://127.0.0.1:9', twoEntries))
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('cannot reach http://127.0.0.1:9')
  })
})
