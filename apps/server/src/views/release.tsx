import type { SessionUser } from '../auth.js'
import { releaseLabel, releasePath, STATUSES, TYPES, type ReleaseSummary, type Status } from '../review.js'
import { Progress, ReleaseNav, StatusPill, statusLabel, typePlural } from './components.js'
import { Shell } from './shell.js'

export interface ListEntry {
  id: string
  title: string
  type: string
  date: string
  status: string
  media: unknown
  _count: { events: number }
}

function EntryRow({ entry }: { entry: ListEntry }) {
  const media = Array.isArray(entry.media) ? entry.media.length : 0
  const comments = entry._count.events
  return (
    <li>
      <a
        href={`/entries/${entry.id}`}
        class="group flex items-center gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300 hover:shadow"
      >
        <div class="min-w-0 grow">
          <p class="truncate font-medium text-stone-900 group-hover:underline" safe>
            {entry.title}
          </p>
          <p class="mt-0.5 text-xs text-stone-500" safe>
            {[entry.date, comments > 0 && `${comments} ${comments === 1 ? 'comment' : 'comments'}`, media > 0 && `${media} media`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <StatusPill status={entry.status} />
      </a>
    </li>
  )
}

export function ReleasePage(props: {
  user: SessionUser
  releases: ReleaseSummary[]
  summary: ReleaseSummary
  entries: ListEntry[]
  filter: Status | undefined
}) {
  const { user, releases, summary, entries, filter } = props
  const base = releasePath(summary.version)
  const visible = filter ? entries.filter((e) => e.status === filter) : entries
  const tabs: Array<[Status | undefined, string, number]> = [
    [undefined, 'All', summary.total],
    ...STATUSES.map((s): [Status, string, number] => [s, statusLabel(s), summary.counts[s]]),
  ]
  return (
    <Shell title={releaseLabel(summary.version)} user={user} sidebar={<ReleaseNav releases={releases} current={summary.version} />}>
      <h1 class="text-3xl font-semibold tracking-tight" safe>{releaseLabel(summary.version)}</h1>
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
            <section class="mt-8">
              <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500">
                <span safe>{typePlural(type)}</span>
                <span class="font-normal text-stone-400" safe>{String(group.length)}</span>
              </h2>
              <ul class="space-y-2">
                {group.map((entry) => (
                  <EntryRow entry={entry} />
                ))}
              </ul>
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
