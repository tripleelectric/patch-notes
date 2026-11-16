import { formatDate, t, type MessageKey } from '../i18n.js'
import type { ReleaseSummary, Status } from '../review.js'
import { releaseLabel, releasePath, STATUSES, TYPES } from '../review.js'

const STATUS_STYLE: Record<Status, { className: string; dot: string }> = {
  'awaiting-review': { className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  accepted: { className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  'changes-requested': { className: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
}

const known = (list: readonly string[], value: string) => list.includes(value)
export const statusLabel = (status: string) => (known(STATUSES, status) ? t(`status.${status}` as MessageKey) : status)
export const typeLabel = (type: string) => (known(TYPES, type) ? t(`type.${type}` as MessageKey) : type)
export const typePlural = (type: string) => (known(TYPES, type) ? t(`types.${type}` as MessageKey) : type)

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLE[status as Status] ?? STATUS_STYLE['awaiting-review']
  return (
    <span class={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}>
      <span class={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span safe>{statusLabel(status)}</span>
    </span>
  )
}

const TYPE_STYLE: Record<string, string> = {
  feature: 'bg-indigo-50 text-indigo-700',
  fix: 'bg-sky-50 text-sky-700',
  change: 'bg-stone-100 text-stone-700',
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span class={`rounded px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide ${TYPE_STYLE[type] ?? TYPE_STYLE.change}`} safe>
      {typeLabel(type)}
    </span>
  )
}

/** Position number of an entry within its release. */
export function Position({ value, small = false }: { value: number; small?: boolean }) {
  return (
    <span
      class={`inline-flex shrink-0 items-center justify-center rounded-md bg-stone-900 font-semibold tabular-nums text-white ${
        small ? 'h-4 min-w-4 px-1 text-[10px]' : 'h-7 min-w-7 px-1.5 text-sm'
      }`}
      safe
    >
      {String(value)}
    </span>
  )
}

const STATUS_DOT: Record<string, string> = { 'awaiting-review': 'bg-amber-400', accepted: 'bg-emerald-500', 'changes-requested': 'bg-rose-500' }

export interface TocEntry {
  id: string
  title: string
  status: string
  position: number
}

export function ReleaseNav({ releases, current, entries = [] }: { releases: ReleaseSummary[]; current: string | null | undefined; entries?: TocEntry[] }) {
  return (
    <nav aria-label="Releases">
      <h2 class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500" safe>
        {t('nav.patches')}
      </h2>
      <ul class="space-y-0.5">
        {releases.map((release) => {
          const active = release.version === current
          const done = release.counts.accepted === release.total
          return (
            <li>
              <a
                href={releasePath(release.version)}
                aria-current={active ? 'page' : undefined}
                class={`flex items-center gap-3 whitespace-nowrap rounded-md px-2 py-1.5 text-sm ${
                  active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <span class="flex min-w-0 flex-col">
                  <span class="font-medium" safe>
                    {releaseLabel(release.version)}
                  </span>
                  {release.date ? (
                    <span class={`text-xs ${active ? 'text-stone-300' : 'text-stone-500'}`} safe>
                      {formatDate(release.date)}
                    </span>
                  ) : (
                    ''
                  )}
                </span>
                <span class={`ml-auto text-xs tabular-nums ${active ? 'text-stone-300' : 'text-stone-500'}`} safe>
                  {`${done ? '✓ ' : ''}${release.counts.accepted}/${release.total}`}
                </span>
              </a>
              {active && entries.length > 0 ? (
                <ul class="mt-1 mb-2 ml-3 space-y-0.5 border-l border-stone-200 pl-2">
                  {entries.map((entry) => (
                    <li>
                      <a
                        href={`#entry-${entry.id}`}
                        hx-boost="false"
                        class="flex items-start gap-2 rounded px-1.5 py-1 text-xs text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
                      >
                        <span class="w-5 shrink-0 text-right tabular-nums text-stone-400" safe>{`${entry.position}.`}</span>
                        <span class={`mt-1 size-1.5 shrink-0 rounded-full ${STATUS_DOT[entry.status] ?? 'bg-stone-400'}`} aria-hidden="true" />
                        <span class="sr-only" safe>{`${statusLabel(entry.status)}:`}</span>
                        <span class="line-clamp-2" safe>{entry.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                ''
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function Progress({ counts, total }: { counts: Record<Status, number>; total: number }) {
  // SVG geometry instead of inline styles, which the CSP blocks.
  const segments: Array<[number, string]> = [
    [counts.accepted, 'fill-emerald-500'],
    [counts['changes-requested'], 'fill-rose-500'],
    [counts['awaiting-review'], 'fill-amber-400'],
  ]
  let x = 0
  return (
    <div>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" class="h-2 w-full overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
        {segments.map(([count, fill]) => {
          const width = total === 0 ? 0 : (count / total) * 100
          const rect = <rect x={String(x)} width={String(width)} height="4" class={fill} />
          x += width
          return rect
        })}
      </svg>
      <p class="mt-2 text-sm text-stone-600">
        <strong class="font-semibold text-stone-900" safe>
          {t('progress.accepted', { accepted: counts.accepted, total })}
        </strong>
        <span safe>{t('progress.rest', { changes: counts['changes-requested'], awaiting: counts['awaiting-review'] })}</span>
      </p>
    </div>
  )
}
