import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'
import { PrismaClient } from './generated/prisma/client.js'

export const MIGRATIONS_DIR = new URL('../prisma/migrations', import.meta.url).pathname

/** Applies every not yet applied `<dir>/<name>/migration.sql` in name order, each in its own transaction. */
export function migrate(dbPath: string, migrationsDir = MIGRATIONS_DIR): string[] {
  const db = new Database(dbPath)
  try {
    db.pragma('journal_mode = WAL')
    db.exec('CREATE TABLE IF NOT EXISTS _patchnotes_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
    const applied = new Set(db.prepare('SELECT name FROM _patchnotes_migrations').pluck().all() as string[])
    const pending = existsSync(migrationsDir)
      ? readdirSync(migrationsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && !applied.has(d.name))
          .map((d) => d.name)
          .sort()
      : []
    for (const name of pending) {
      const sql = readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8')
      db.transaction(() => {
        db.exec(sql)
        db.prepare('INSERT INTO _patchnotes_migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString())
      })()
    }
    return pending
  } finally {
    db.close()
  }
}

export function createPrisma(dbPath: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }) })
}
