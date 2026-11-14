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

export function ReleaseNav({ releases, current }: { releases: ReleaseSummary[]; current: string | null | undefined }) {
  return (
    <nav aria-label="Releases">
      <h2 class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Releases</h2>
      <ul class="flex gap-1 overflow-x-auto lg:flex-col">
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
