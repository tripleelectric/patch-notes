import type { PrismaClient } from './generated/prisma/client.js'

export const STATUSES = ['awaiting-review', 'accepted', 'changes-requested'] as const
export type Status = (typeof STATUSES)[number]
export const TYPES = ['feature', 'fix', 'change'] as const

export interface ReleaseSummary {
  version: string | null
  total: number
  counts: Record<Status, number>
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
export const releaseLabel = (version: string | null) => (version === null ? 'Unreleased' : `v${version}`)
export const releasePath = (version: string | null) => `/releases/${releaseSlug(version)}`

export async function releaseSummaries(prisma: PrismaClient): Promise<ReleaseSummary[]> {
  const rows = await prisma.entry.groupBy({ by: ['version', 'status'], where: { removedAt: null }, _count: { _all: true } })
  const byVersion = new Map<string | null, ReleaseSummary>()
  for (const row of rows) {
    const summary = byVersion.get(row.version) ?? {
      version: row.version,
      total: 0,
      counts: { 'awaiting-review': 0, accepted: 0, 'changes-requested': 0 },
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
    select: {
      id: true,
      title: true,
      type: true,
      date: true,
      status: true,
      media: true,
      _count: { select: { events: { where: { body: { not: null } } } } },
    },
  })
  return entries.sort(compareEntries)
}

/** Next entry awaiting review after `currentId` in release order, wrapping around. */
export function nextAwaiting<T extends { id: string; status: string }>(ordered: T[], currentId: string): T | undefined {
  const index = ordered.findIndex((e) => e.id === currentId)
  const rotated = [...ordered.slice(index + 1), ...ordered.slice(0, Math.max(index, 0))]
  return rotated.find((e) => e.id !== currentId && e.status === 'awaiting-review')
}
