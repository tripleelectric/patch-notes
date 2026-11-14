import { existsSync } from 'node:fs'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { MIGRATIONS_DIR } from './db.js'
import { login, testApp, testConfig, tmpDir } from './test-utils.js'

describe('startup', () => {
  it('creates the data directory and database', async () => {
    const dataDir = join(await tmpDir(), 'nested/data')
    await testApp({ dataDir })
    expect(existsSync(join(dataDir, 'patchnotes.db'))).toBe(true)
  })

  it('applies migrations once and keeps data across restarts', async () => {
    const dataDir = await tmpDir()
    const migrationsDir = join(await tmpDir(), 'migrations')
    await cp(MIGRATIONS_DIR, migrationsDir, { recursive: true })
    await mkdir(join(migrationsDir, 'zz_001_init'))
    await writeFile(join(migrationsDir, 'zz_001_init/migration.sql'), 'CREATE TABLE thing (id INTEGER PRIMARY KEY, name TEXT);')
    const config = await testConfig({ dataDir })

    const first = await buildApp(config, { migrationsDir })
    await first.prisma.$executeRaw`INSERT INTO thing (name) VALUES ('kept')`
    await first.close()

    await mkdir(join(migrationsDir, 'zz_002_more'))
    await writeFile(join(migrationsDir, 'zz_002_more/migration.sql'), 'ALTER TABLE thing ADD COLUMN extra TEXT;')
    const second = await buildApp(config, { migrationsDir })
    expect(await second.prisma.$queryRaw`SELECT name, extra FROM thing`).toEqual([{ name: 'kept', extra: null }])
    await second.close()

    const db = new Database(join(dataDir, 'patchnotes.db'))
    expect(db.prepare('SELECT name FROM _patchnotes_migrations ORDER BY name').pluck().all().slice(-2)).toEqual(['zz_001_init', 'zz_002_more'])
    db.close()
  })

  it('stops on a failing migration', async () => {
    const migrationsDir = join(await tmpDir(), 'migrations')
    await mkdir(join(migrationsDir, '001_bad'), { recursive: true })
    await writeFile(join(migrationsDir, '001_bad/migration.sql'), 'CREATE TABLE broken (')
    await expect(testApp({}, { migrationsDir })).rejects.toThrow()
  })
})

describe('http', () => {
  it('answers the health check', async () => {
    const response = await (await testApp()).inject('/healthz')
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('serves pages with local assets and security headers', async () => {
    const app = await testApp()
    const page = await app.inject({ url: '/', headers: { cookie: await login(app) } })
    expect(page.statusCode).toBe(200)
    expect(page.body).toMatch(/^<!doctype html>/i)
    expect(page.body).toContain('href="/assets/app.css"')
    expect(page.body).toContain('src="/assets/htmx.min.js"')
    expect(page.headers['content-security-policy']).toContain("script-src 'self'")
    expect(page.headers['x-content-type-options']).toBe('nosniff')
    for (const asset of ['/assets/app.css', '/assets/htmx.min.js']) {
      expect((await app.inject(asset)).statusCode).toBe(200)
    }
  })
})
