import type { SessionUser } from '../auth.js'
import { formatDate, t } from '../i18n.js'
import { releaseLabel, releaseSlug, TYPES, type ReleaseSummary } from '../review.js'
import { openRequestsLabel, typePlural } from './components.js'
import { EntryRow, type EntryExtras, type EntryView } from './entry.js'
import { Shell } from './shell.js'

export const FILTERS = [...TYPES, 'changes-requested'] as const
export type Filter = (typeof FILTERS)[number]

export type TimelineEntry = EntryView & EntryExtras & { position: number; open?: boolean }
export interface TimelineSection {
  summary: ReleaseSummary
  entries: TimelineEntry[]
}

function Filters({ filter, counts }: { filter: Filter | undefined; counts: Record<Filter | 'all', number> }) {
  const items: Array<[Filter | undefined, string, number]> = [
    [undefined, t('timeline.all'), counts.all],
    ...TYPES.map((type): [Filter, string, number] => [type, typePlural(type), counts[type]]),
    ['changes-requested', t('timeline.changes'), counts['changes-requested']],
  ]
  return (
    <nav aria-label={t('nav.filters')} class="-my-2 flex gap-1 overflow-x-auto py-2">
      {items.map(([value, label, count]) => (
        <a
          href={value ? `/?show=${value}` : '/'}
          aria-current={value === filter ? 'page' : undefined}
          class={`shrink-0 rounded-md px-2.5 py-1.5 text-[13px] ${
            value === filter ? 'bg-panel-2 text-fg shadow-[inset_0_0_0_1px_var(--line)]' : 'text-muted hover:bg-panel-2 hover:text-fg'
          }`}
        >
          <span safe>{label}</span>
          <span class={`ml-1.5 font-mono tabular-nums ${value === 'changes-requested' && count > 0 ? 'text-flag' : 'text-faint'}`} safe>
            {String(count)}
          </span>
        </a>
      ))}
    </nav>
  )
}

function Rail({ summary, last }: { summary: ReleaseSummary; last: boolean }) {
  const requests = summary.counts['changes-requested']
  const unreleased = summary.version === null
  return (
    <div class="relative">
      {last ? '' : <span class="absolute bottom-[-2rem] left-[7px] top-7 hidden w-px bg-line lg:block" aria-hidden="true" />}
      <div class="relative pl-6 lg:sticky lg:top-20">
        <span
          class={`absolute left-[3px] top-[7px] size-[9px] rounded-full ring-2 ring-accent ${unreleased ? 'bg-accent shadow-[0_0_14px_var(--accent)]' : 'bg-bg'}`}
          aria-hidden="true"
        />
        <h2 class="font-mono text-[15px] font-medium" safe>
          {releaseLabel(summary.version)}
        </h2>
        <p class="mt-0.5 text-[13px] text-muted">
          {summary.date ? (
            <time datetime={summary.date} safe>
              {formatDate(summary.date)}
            </time>
          ) : (
            <span safe>{t('release.notYet')}</span>
          )}
        </p>
        <p class="mt-1.5 font-mono text-xs text-faint" safe>
          {summary.total === 1 ? t('release.entry') : t('release.entries', { count: summary.total })}
        </p>
        {requests > 0 ? (
          <p class="mt-1 font-mono text-xs text-flag" safe>
            {openRequestsLabel(requests)}
          </p>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}

export function TimelinePage(props: {
  user: SessionUser
  sections: TimelineSection[]
  counts: Record<Filter | 'all', number>
  filter: Filter | undefined
}) {
  const { user, sections, counts, filter } = props
  return (
    <Shell title={t('timeline.title')} user={user} toolbar={<Filters filter={filter} counts={counts} />}>
      <h1 class="pb-6 pt-10 text-3xl font-semibold tracking-tight" safe>
        {filter ? (filter === 'changes-requested' ? t('timeline.changes') : typePlural(filter)) : t('timeline.title')}
      </h1>
      {sections.length === 0 ? (
        <p class="py-6 text-muted" safe>
          {t('timeline.none')}
        </p>
      ) : (
        <div class="grid gap-10">
          {sections.map(({ summary, entries }, index) => (
            <section
              id={`release-${releaseSlug(summary.version)}`}
              aria-label={releaseLabel(summary.version)}
              class="grid scroll-mt-20 gap-3 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8"
            >
              <Rail summary={summary} last={index === sections.length - 1} />
              <div class="grid min-w-0 content-start gap-1.5">
                {entries.map((entry) => (
                  <EntryRow {...entry} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Shell>
  )
}

export function EmptyPage({ user }: { user: SessionUser }) {
  return (
    <Shell title={t('timeline.title')} user={user}>
      <div class="mx-auto mt-16 max-w-md text-center">
        <h1 class="text-2xl font-semibold" safe>
          {t('release.emptyTitle')}
        </h1>
        <p class="mt-3 text-muted" safe>
          {t('release.emptyHint')}
        </p>
        <pre class="mt-4 rounded-lg bg-panel px-4 py-3 text-left font-mono text-sm shadow-[inset_0_0_0_1px_var(--line)]">
          <code>PATCHNOTES_TOKEN=… patchnotes publish</code>
        </pre>
      </div>
    </Shell>
  )
}
