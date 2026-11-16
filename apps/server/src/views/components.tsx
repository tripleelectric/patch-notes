import { formatDate, t, type MessageKey } from '../i18n.js'
import type { ReleaseSummary } from '../review.js'
import { releaseLabel, releasePath, TYPES } from '../review.js'

const known = (list: readonly string[], value: string) => list.includes(value)
export const typeLabel = (type: string) => (known(TYPES, type) ? t(`type.${type}` as MessageKey) : type)
export const typePlural = (type: string) => (known(TYPES, type) ? t(`types.${type}` as MessageKey) : type)

/** Shown only on entries with an open change request; entries are otherwise just read. */
export function ChangeRequestBadge() {
  return (
    <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-inset ring-rose-200">
      <span class="size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
      <span safe>{t('status.changes-requested')}</span>
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
export function Position({ value }: { value: number }) {
  return (
    <span class="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-stone-900 px-1.5 text-sm font-semibold tabular-nums text-white" safe>
      {String(value)}
    </span>
  )
}

export const openRequestsLabel = (count: number) => (count === 1 ? t('release.openRequest') : t('release.openRequests', { count }))

export interface TocEntry {
  id: string
  title: string
  status: string
  position: number
}

export function ReleaseNav({ releases, current, entries = [] }: { releases: ReleaseSummary[]; current: string | null | undefined; entries?: TocEntry[] }) {
  return (
    <nav aria-label={t('nav.releases')}>
      <h2 class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500" safe>
        {t('nav.patches')}
      </h2>
      <ul class="space-y-0.5">
        {releases.map((release) => {
          const active = release.version === current
          const requests = release.counts['changes-requested']
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
                <span class="ml-auto flex items-center gap-2 text-xs tabular-nums">
                  {requests > 0 ? (
                    <span class="rounded-full bg-rose-500 px-1.5 font-semibold text-white" title={openRequestsLabel(requests)} safe>
                      {String(requests)}
                    </span>
                  ) : (
                    ''
                  )}
                  <span class={active ? 'text-stone-300' : 'text-stone-500'} safe>
                    {String(release.total)}
                  </span>
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
                        <span class="line-clamp-2 grow" safe>
                          {entry.title}
                        </span>
                        {entry.status === 'changes-requested' ? (
                          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-rose-500" title={t('status.changes-requested')}>
                            <span class="sr-only" safe>{t('status.changes-requested')}</span>
                          </span>
                        ) : (
                          ''
                        )}
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
