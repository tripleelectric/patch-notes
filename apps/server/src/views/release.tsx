import type { SessionUser } from '../auth.js'
import { formatDate, t } from '../i18n.js'
import { releaseLabel, releasePath, TYPES, type ReleaseSummary, type Status } from '../review.js'
import { openRequestsLabel, ReleaseNav, typePlural } from './components.js'
import { EntrySection, type EntryExtras, type EntryView } from './entry.js'
import { Shell } from './shell.js'

export type SectionEntry = EntryView & EntryExtras & { position: number }

export function ReleasePage(props: { user: SessionUser; releases: ReleaseSummary[]; summary: ReleaseSummary; entries: SectionEntry[]; filter: Status | undefined }) {
  const { user, releases, summary, entries, filter } = props
  const base = releasePath(summary.version)
  const visible = filter ? entries.filter((e) => e.status === filter) : entries
  const requests = summary.counts['changes-requested']
  const sidebar = (
    <div class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <ReleaseNav releases={releases} current={summary.version} entries={visible} />
    </div>
  )
  return (
    <Shell title={releaseLabel(summary.version)} user={user} sidebar={sidebar}>
      <h1 class="text-4xl font-bold tracking-tight" safe>
        {summary.version === null ? t('release.unreleased') : t('release.patch', { version: summary.version })}
      </h1>
      <p class="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
        {summary.date ? (
          <time datetime={summary.date} class="font-medium text-stone-700" safe>
            {t('release.releasedOn', { date: formatDate(summary.date) })}
          </time>
        ) : (
          <span class="font-medium text-stone-700" safe>
            {t('release.notYet')}
          </span>
        )}
        <span aria-hidden="true">·</span>
        <span safe>{summary.total === 1 ? t('release.entry') : t('release.entries', { count: summary.total })}</span>
        {requests > 0 ? (
          <a
            href={filter ? base : `${base}?status=changes-requested`}
            class={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              filter ? 'bg-rose-600 text-white ring-rose-600' : 'bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100'
            }`}
            aria-current={filter ? 'page' : undefined}
            safe
          >
            {openRequestsLabel(requests)}
          </a>
        ) : (
          ''
        )}
      </p>
      {visible.length === 0 ? (
        <p class="mt-10 text-sm text-stone-500" safe>
          {t('release.noneWithStatus')}
        </p>
      ) : (
        TYPES.map((type) => {
          const group = visible.filter((e) => e.type === type)
          if (group.length === 0) return ''
          return (
            <section class="mt-10">
              <h2 class="mb-4 flex items-baseline gap-2 border-b-2 border-stone-900 pb-2 text-xl font-bold uppercase tracking-wide">
                <span safe>{typePlural(type)}</span>
                <span class="text-sm font-normal text-stone-400" safe>{String(group.length)}</span>
              </h2>
              <div class="space-y-4">
                {group.map((entry) => (
                  <EntrySection {...entry} entry={entry} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </Shell>
  )
}

export function EmptyPage({ user }: { user: SessionUser }) {
  return (
    <Shell title="Patch notes" user={user}>
      <div class="mx-auto mt-16 max-w-md text-center">
        <h1 class="text-2xl font-semibold" safe>
          {t('release.emptyTitle')}
        </h1>
        <p class="mt-3 text-stone-600" safe>
          {t('release.emptyHint')}
        </p>
        <pre class="mt-4 rounded-lg bg-stone-900 px-4 py-3 text-left text-sm text-stone-100">
          <code>PATCHNOTES_TOKEN=… patchnotes publish</code>
        </pre>
      </div>
    </Shell>
  )
}
