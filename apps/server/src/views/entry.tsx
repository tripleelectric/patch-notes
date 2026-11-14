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
  removedAt: Date | null
  events: Array<{ id: string; kind: string; body: string | null; createdAt: Date; user: { name: string } | null }>
}

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
    <figure class="rounded-lg border border-stone-200 bg-white p-3">
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
  if (events.length === 0) return <p class="text-sm text-stone-500">No activity yet.</p>
  return (
    <ol class="space-y-4">
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
  )
}

function ReviewPanel({ entry, comment, error }: { entry: EntryView; comment: string; error: string | undefined }) {
  return (
    <form method="post" action={`/entries/${entry.id}/review`} class="space-y-3">
      {error ? <Alert kind="error" message={error} /> : ''}
      <label class="block text-sm font-medium" for="review-comment">
        Comment
      </label>
      <textarea
        id="review-comment"
        name="body"
        rows="4"
        maxlength="5000"
        placeholder="Required when requesting changes"
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

export function EntryPage(props: {
  user: SessionUser
  entry: EntryView
  safeBodyHtml: string
  tryUrl: string | undefined
  next: { id: string; title: string } | undefined
  comment?: string
  error?: string
}) {
  const { user, entry, safeBodyHtml, tryUrl, next, comment = '', error } = props
  const requests = Array.isArray(entry.requests) ? (entry.requests as string[]) : []
  const media = Array.isArray(entry.media) ? (entry.media as MediaItem[]) : []
  return (
    <Shell title={entry.title} user={user}>
      <nav aria-label="Breadcrumb" class="text-sm text-stone-500">
        <a href={releasePath(entry.version)} class="hover:underline" safe>
          {`← ${releaseLabel(entry.version)}`}
        </a>
      </nav>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight" safe>
        {entry.title}
      </h1>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500">
        <TypeBadge type={entry.type} />
        <span safe>{entry.date}</span>
        <StatusPill status={entry.status} />
      </div>

      {entry.removedAt ? (
        <div class="mt-6">
          <Alert kind="error" message="This entry was removed from the repository and is no longer part of the patch notes." />
        </div>
      ) : (
        ''
      )}

      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0 space-y-6">
          {tryUrl || entry.try || requests.length > 0 ? (
            <div class="flex flex-wrap items-center gap-2">
              {tryUrl ? (
                <a
                  href={tryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                >
                  Try it ↗
                </a>
              ) : entry.try ? (
                <span class="rounded-md bg-stone-100 px-3 py-1.5 font-mono text-sm text-stone-700" safe>
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
                  class="rounded-md bg-white px-3 py-1.5 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100"
                >
                  {requests.length > 1 ? `Request ${index + 1} ↗` : 'Request ↗'}
                </a>
              ))}
            </div>
          ) : (
            ''
          )}
          {media.map((item) => (
            <MediaBlock item={item} />
          ))}
          <article class="prose">{safeBodyHtml}</article>
        </div>

        <aside class="space-y-6">
          {entry.removedAt ? (
            ''
          ) : (
            <section class="rounded-lg border border-stone-200 bg-white p-4">
              <h2 class="mb-3 text-sm font-semibold">Your review</h2>
              <ReviewPanel entry={entry} comment={comment} error={error} />
            </section>
          )}
          <section class="rounded-lg border border-stone-200 bg-white p-4 text-sm">
            {next ? (
              <a href={`/entries/${next.id}`} class="flex items-center gap-2 font-medium text-stone-900 hover:underline">
                <span class="min-w-0 truncate">
                  Next to review: <span safe>{next.title}</span>
                </span>
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <p class="text-stone-500">Nothing else awaits review in this release.</p>
            )}
          </section>
          <section>
            <h2 class="mb-3 text-sm font-semibold">History</h2>
            <History events={entry.events} />
          </section>
        </aside>
      </div>
    </Shell>
  )
}
