import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { onTestFinished } from 'vitest'
import { buildApp, type AppOptions } from './app.js'
import type { Config } from './config.js'

export async function tmpDir(): Promise<string> {
  const dir = await mkdtemp(join(await realpath(tmpdir()), 'patchnotes-server-'))
  onTestFinished(() => rm(dir, { recursive: true, force: true }))
  return dir
}

export async function testApp(overrides: Partial<Config> = {}, options: AppOptions = {}) {
  const config: Config = { dataDir: await tmpDir(), port: 0, host: '127.0.0.1', baseUrl: 'http://localhost:3000', ...overrides }
  const app = await buildApp(config, options)
  onTestFinished(() => app.close())
  return app
}
