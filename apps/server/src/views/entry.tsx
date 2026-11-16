import type { SessionUser } from '../auth.js'
import { mediaFileName } from '../media.js'
import { releaseLabel, releasePath } from '../review.js'
import { StatusPill, TypeBadge } from './components.js'
import { Alert, Shell } from './shell.js'

interface MediaRef {
  sha256: string
  contentType: string
}
type MediaItem = { caption?: string; image?: MediaRef; video?: MediaRef; before?: MediaRef; after?: MediaRef }

export interface EntryView {
  id: string
  title: string
  type: string
  date: string
  version: string | null
  status: string
  requests: unknown
  try: string | null
  media: unknown
  body: string
  removedAt: Date | null
  events: Array<{ id: string; kind: string; body: string | null; createdAt: Date; user: { name: string } | null }>
}

/** Everything an entry section needs besides the stored entry. */
export interface EntryExtras {
  safeBodyHtml: string
  tryUrl: string | undefined
  comment?: string
  error?: string
}

export const entryAnchor = (id: string) => `entry-${id}`
const mediaUrl = (ref: MediaRef) => `/media/${mediaFileName(ref.sha256, ref.contentType)}`
const formatTime = (date: Date) => `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`

function Image({ media, label }: { media: MediaRef; label: string }) {
  return (
    <a href={mediaUrl(media)} target="_blank" rel="noopener" class="block overflow-hidden rounded-md border border-stone-200 bg-stone-100">
      <img src={mediaUrl(media)} alt={label} loading="lazy" class="w-full" />
    </a>
  )
}

function MediaBlock({ item }: { item: MediaItem }) {
  return (
    <figure>
      {item.before && item.after ? (
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">Before</p>
            <Image media={item.before} label="Before" />
          </div>
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">After</p>
            <Image media={item.after} label="After" />
          </div>
        </div>
      ) : item.video ? (
        <video controls class="w-full rounded-md bg-black" src={mediaUrl(item.video)} />
      ) : item.image ? (
        <Image media={item.image} label={item.caption ?? 'Screenshot'} />
      ) : (
        ''
      )}
      {item.caption ? (
        <figcaption class="mt-2 text-sm text-stone-600" safe>
          {item.caption}
        </figcaption>
      ) : (
        ''
      )}
    </figure>
  )
}

const EVENT_LABEL: Record<string, string> = {
  updated: 'updated the entry',
  accepted: 'accepted',
  'changes-requested': 'requested changes',
  comment: 'commented',
}

function History({ events }: { events: EntryView['events'] }) {
  return (
    <details class="group/history">
      <summary class="cursor-pointer select-none text-sm font-medium text-stone-600 hover:text-stone-900" safe>
        {`History (${events.length})`}
      </summary>
      {events.length === 0 ? (
        <p class="mt-3 text-sm text-stone-500">No activity yet.</p>
      ) : (
        <ol class="mt-3 space-y-3">
          {events.map((event) => (
            <li class="text-sm">
              <p class="text-stone-600">
                <strong class="font-medium text-stone-900" safe>
                  {event.user?.name ?? 'publish'}
                </strong>{' '}
                <span safe>{EVENT_LABEL[event.kind] ?? event.kind}</span>
                <time class="ml-1 text-xs text-stone-400" datetime={event.createdAt.toISOString()} safe>
                  {formatTime(event.createdAt)}
                </time>
              </p>
              {event.body ? (
                <p class="mt-1 whitespace-pre-wrap rounded-md bg-stone-100 px-3 py-2 text-stone-800" safe>
                  {event.body}
                </p>
              ) : (
                ''
              )}
            </li>
          ))}
        </ol>
      )}
    </details>
  )
}

function ReviewForm({ entry, comment, error }: { entry: EntryView; comment: string; error: string | undefined }) {
  const target = `#${entryAnchor(entry.id)}`
  return (
    <form method="post" action={`/entries/${entry.id}/review`} hx-post={`/entries/${entry.id}/review`} hx-target={target} hx-swap="outerHTML" class="space-y-2">
      {error ? <Alert kind="error" message={error} /> : ''}
      <label class="sr-only" for={`comment-${entry.id}`}>
        Comment
      </label>
      <textarea
        id={`comment-${entry.id}`}
        name="body"
        rows="2"
        maxlength="5000"
        placeholder="Comment (required when requesting changes)"
        class="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        safe
      >
        {comment}
      </textarea>
      <div class="flex flex-wrap gap-2">
        <button name="action" value="accept" class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
          Accept
        </button>
        <button name="action" value="request-changes" class="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
          Request changes
        </button>
        <button name="action" value="comment" class="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100">
          Comment
        </button>
      </div>
    </form>
  )
}

/** One entry as a collapsible section; also the htmx fragment returned by review actions. */
export function EntrySection({ entry, safeBodyHtml, tryUrl, comment = '', error }: { entry: EntryView } & EntryExtras) {
  const requests = Array.isArray(entry.requests) ? (entry.requests as string[]) : []
  const media = Array.isArray(entry.media) ? (entry.media as MediaItem[]) : []
  return (
    <details open id={entryAnchor(entry.id)} class="group scroll-mt-6 rounded-xl border border-stone-200 bg-white shadow-sm">
      <summary class="flex cursor-pointer select-none list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span class="text-stone-400 transition-transform group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
        <h3 class="min-w-0 grow text-lg font-semibold tracking-tight" safe>
          {entry.title}
        </h3>
        <StatusPill status={entry.status} />
      </summary>
      <div class="space-y-5 border-t border-stone-100 px-5 pt-4 pb-5">
        <div class="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <TypeBadge type={entry.type} />
          <span safe>{entry.date}</span>
          {tryUrl ? (
            <a
              href={tryUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="ml-auto rounded-md bg-stone-900 px-3 py-1 text-sm font-medium text-white hover:bg-stone-700"
            >
              Try it ↗
            </a>
          ) : entry.try ? (
            <span class="ml-auto rounded-md bg-stone-100 px-2 py-1 font-mono text-xs text-stone-700" safe>
              {entry.try}
            </span>
          ) : (
            ''
          )}
          {requests.map((url, index) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class={`${tryUrl || entry.try || index > 0 ? '' : 'ml-auto '}rounded-md bg-white px-3 py-1 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100`}
            >
              {requests.length > 1 ? `Request ${index + 1} ↗` : 'Request ↗'}
            </a>
          ))}
        </div>
        {media.map((item) => (
          <MediaBlock item={item} />
        ))}
        <article class="prose">{safeBodyHtml}</article>
        <div class="space-y-3 rounded-lg bg-stone-50 p-4">
          {entry.removedAt ? (
            <Alert kind="error" message="This entry was removed from the repository and is no longer part of the patch notes." />
          ) : (
            <ReviewForm entry={entry} comment={comment} error={error} />
          )}
          <History events={entry.events} />
        </div>
      </div>
    </details>
  )
}

export function RemovedEntryPage({ user, entry, ...extras }: { user: SessionUser; entry: EntryView } & EntryExtras) {
  return (
    <Shell title={entry.title} user={user}>
      <nav aria-label="Breadcrumb" class="mb-4 text-sm text-stone-500">
        <a href={releasePath(entry.version)} class="hover:underline" safe>
          {`← ${releaseLabel(entry.version)}`}
        </a>
      </nav>
      <EntrySection entry={entry} {...extras} />
    </Shell>
  )
}
