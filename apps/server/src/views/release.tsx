import type { SessionUser } from '../auth.js'
import { releaseLabel, releasePath, STATUSES, TYPES, type ReleaseSummary, type Status } from '../review.js'
import { Progress, ReleaseNav, statusLabel, typePlural } from './components.js'
import { EntrySection, type EntryExtras, type EntryView } from './entry.js'
import { Shell } from './shell.js'

export type SectionEntry = EntryView & EntryExtras

export function ReleasePage(props: { user: SessionUser; releases: ReleaseSummary[]; summary: ReleaseSummary; entries: SectionEntry[]; filter: Status | undefined }) {
  const { user, releases, summary, entries, filter } = props
  const base = releasePath(summary.version)
  const visible = filter ? entries.filter((e) => e.status === filter) : entries
  const tabs: Array<[Status | undefined, string, number]> = [
    [undefined, 'All', summary.total],
    ...STATUSES.map((s): [Status, string, number] => [s, statusLabel(s), summary.counts[s]]),
  ]
  const sidebar = (
    <div class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <ReleaseNav releases={releases} current={summary.version} entries={visible} />
    </div>
  )
  return (
    <Shell title={releaseLabel(summary.version)} user={user} sidebar={sidebar}>
      <h1 class="text-4xl font-bold tracking-tight" safe>
        {summary.version === null ? 'Unreleased' : `Patch ${summary.version}`}
      </h1>
      <p class="mt-1 text-sm text-stone-500" safe>
        {`${summary.version === null ? 'Shipped, not yet in a release' : 'Released'} · ${summary.total} ${summary.total === 1 ? 'entry' : 'entries'}`}
      </p>
      <div class="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <Progress counts={summary.counts} total={summary.total} />
      </div>

      <div class="mt-6 flex flex-wrap gap-2" role="list" aria-label="Filter by status">
        {tabs.map(([status, label, count]) => (
          <a
            role="listitem"
            href={status ? `${base}?status=${status}` : base}
            aria-current={status === filter ? 'page' : undefined}
            class={`rounded-full px-3 py-1 text-sm ${
              status === filter ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100'
            }`}
          >
            <span safe>{label}</span> <span class="tabular-nums opacity-70" safe>{String(count)}</span>
          </a>
        ))}
      </div>

      {visible.length === 0 ? (
        <p class="mt-10 text-sm text-stone-500">No entries with this status.</p>
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
        <h1 class="text-2xl font-semibold">Nothing published yet</h1>
        <p class="mt-3 text-stone-600">Publish the project's patch notes from its repository:</p>
        <pre class="mt-4 rounded-lg bg-stone-900 px-4 py-3 text-left text-sm text-stone-100">
          <code>PATCHNOTES_TOKEN=… patchnotes publish</code>
        </pre>
      </div>
    </Shell>
  )
}
