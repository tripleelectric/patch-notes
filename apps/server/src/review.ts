import type { PrismaClient } from './generated/prisma/client.js'
import { t } from './i18n.js'

export const STATUSES = ['awaiting-review', 'accepted', 'changes-requested'] as const
export type Status = (typeof STATUSES)[number]
export const TYPES = ['feature', 'fix', 'change'] as const

export interface ReleaseSummary {
  version: string | null
  total: number
  counts: Record<Status, number>
  /** Ship date `YYYY-MM-DD`: the published release date, else the newest entry date; undefined for unreleased. */
  date: string | undefined
}

const versionParts = (version: string) => version.split('.').map(Number)
/** Unreleased first, then versions from highest to lowest. */
export function compareReleases(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return -1
  if (b === null) return 1
  const [x, y] = [versionParts(a), versionParts(b)]
  return y[0]! - x[0]! || y[1]! - x[1]! || y[2]! - x[2]!
}

export const releaseSlug = (version: string | null) => version ?? 'unreleased'
export const releaseLabel = (version: string | null) => (version === null ? t('release.unreleased') : `v${version}`)
export const releasePath = (version: string | null) => `/releases/${releaseSlug(version)}`

export async function releaseSummaries(prisma: PrismaClient): Promise<ReleaseSummary[]> {
  const [rows, newest, published] = await Promise.all([
    prisma.entry.groupBy({ by: ['version', 'status'], where: { removedAt: null }, _count: { _all: true } }),
    prisma.entry.groupBy({ by: ['version'], where: { removedAt: null }, _max: { date: true } }),
    prisma.release.findMany(),
  ])
  const dates = new Map<string | null, string | undefined>(newest.map((row) => [row.version, row._max.date ?? undefined]))
  for (const release of published) dates.set(release.version, release.date)
  const byVersion = new Map<string | null, ReleaseSummary>()
  for (const row of rows) {
    const summary = byVersion.get(row.version) ?? {
      version: row.version,
      total: 0,
      counts: { 'awaiting-review': 0, accepted: 0, 'changes-requested': 0 },
      date: row.version === null ? undefined : dates.get(row.version),
    }
    const status = (STATUSES as readonly string[]).includes(row.status) ? (row.status as Status) : 'awaiting-review'
    summary.counts[status] += row._count._all
    summary.total += row._count._all
    byVersion.set(row.version, summary)
  }
  return [...byVersion.values()].sort((a, b) => compareReleases(a.version, b.version))
}

interface Sortable {
  type: string
  date: string
  title: string
}
/** Release list order: type (feature, fix, change), newest date first, then title. */
export function compareEntries(a: Sortable, b: Sortable): number {
  const type = (t: string) => (TYPES as readonly string[]).indexOf(t)
  return type(a.type) - type(b.type) || b.date.localeCompare(a.date) || a.title.localeCompare(b.title)
}

export async function releaseEntries(prisma: PrismaClient, version: string | null) {
  const entries = await prisma.entry.findMany({
    where: { version, removedAt: null },
    include: { events: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } } },
  })
  return entries.sort(compareEntries)
}

export async function appUrl(prisma: PrismaClient): Promise<string | undefined> {
  return (await prisma.setting.findUnique({ where: { key: 'appUrl' } }))?.value
}

/** Absolute try URL: kept when absolute, appended to appUrl when a path, undefined when not resolvable. */
export function resolveTry(tryLink: string | null, base: string | undefined): string | undefined {
  if (!tryLink) return undefined
  if (/^https?:/.test(tryLink)) return tryLink
  return base ? base.replace(/\/+$/, '') + tryLink : undefined
}
