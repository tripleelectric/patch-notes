import type { ReleaseSummary, Status } from '../review.js'
import { releaseLabel, releasePath } from '../review.js'

const STATUS_STYLE: Record<Status, { label: string; className: string; dot: string }> = {
  'awaiting-review': { label: 'Awaiting review', className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  'changes-requested': { label: 'Changes requested', className: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
}

export const statusLabel = (status: string) => STATUS_STYLE[status as Status]?.label ?? status

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLE[status as Status] ?? STATUS_STYLE['awaiting-review']
  return (
    <span class={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}>
      <span class={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span safe>{style.label}</span>
    </span>
  )
}

const TYPE_STYLE: Record<string, { label: string; plural: string; className: string }> = {
  feature: { label: 'Feature', plural: 'Features', className: 'bg-indigo-50 text-indigo-700' },
  fix: { label: 'Fix', plural: 'Fixes', className: 'bg-sky-50 text-sky-700' },
  change: { label: 'Change', plural: 'Changes', className: 'bg-stone-100 text-stone-700' },
}

export const typePlural = (type: string) => TYPE_STYLE[type]?.plural ?? type

export function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLE[type] ?? TYPE_STYLE.change!
  return <span class={`rounded px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide ${style.className}`} safe>{style.label}</span>
}

const STATUS_DOT: Record<string, string> = { 'awaiting-review': 'bg-amber-400', accepted: 'bg-emerald-500', 'changes-requested': 'bg-rose-500' }

export interface TocEntry {
  id: string
  title: string
  status: string
}

export function ReleaseNav({ releases, current, entries = [] }: { releases: ReleaseSummary[]; current: string | null | undefined; entries?: TocEntry[] }) {
  return (
    <nav aria-label="Releases">
      <h2 class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Patches</h2>
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
                <span class="font-medium" safe>{releaseLabel(release.version)}</span>
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
        <strong class="font-semibold text-stone-900" safe>{`${counts.accepted} of ${total} accepted`}</strong>
        <span safe>{` · ${counts['changes-requested']} changes requested · ${counts['awaiting-review']} awaiting review`}</span>
      </p>
    </div>
  )
}
