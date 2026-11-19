import type { SessionUser } from '../auth.js'
import { mediaFileName } from '../media.js'
import { formatDate, formatTime, t, type MessageKey } from '../i18n.js'
import { ChangeRequestMarker, TypeTag } from './components.js'
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

function Image({ media, label }: { media: MediaRef; label: string }) {
  return (
    <a href={mediaUrl(media)} target="_blank" rel="noopener" class="block overflow-hidden" hx-boost="false">
      <img src={mediaUrl(media)} alt={label} loading="lazy" width="1200" height="750" class="h-auto w-full" />
    </a>
  )
}

const mediaLabel = 'px-3 pb-1.5 pt-2.5 font-mono text-[11px] uppercase tracking-wider'

function MediaBlock({ item }: { item: MediaItem }) {
  return (
    <figure class="overflow-hidden rounded-lg bg-panel shadow-[0_0_0_1px_var(--line)]">
      {item.before && item.after ? (
        <div class="grid sm:grid-cols-2">
          <div>
            <p class={`${mediaLabel} text-muted`} safe>
              {t('entry.before')}
            </p>
            <Image media={item.before} label={t('entry.before')} />
          </div>
          <div class="sm:border-l sm:border-line">
            <p class={`${mediaLabel} text-ok`} safe>
              {t('entry.after')}
            </p>
            <Image media={item.after} label={t('entry.after')} />
          </div>
        </div>
      ) : item.video ? (
        <video controls class="w-full bg-black" src={mediaUrl(item.video)} />
      ) : item.image ? (
        <Image media={item.image} label={item.caption ?? t('entry.screenshot')} />
      ) : (
        ''
      )}
      {item.caption ? (
        <figcaption class="border-t border-line px-3 py-2 text-sm text-muted" safe>
          {item.caption}
        </figcaption>
      ) : (
        ''
      )}
    </figure>
  )
}

const EVENT_KINDS = ['updated', 'accepted', 'changes-requested', 'comment', 'resolved']
const eventLabel = (kind: string) => (EVENT_KINDS.includes(kind) ? t(`event.${kind}` as MessageKey) : kind)

function History({ events }: { events: EntryView['events'] }) {
  if (events.length === 0) return ''
  return (
    <ol class="grid gap-3 text-[13px] text-muted">
      {events.map((event) => (
        <li>
          <strong class="font-medium text-fg" safe>
            {event.user?.name ?? t('entry.publisher')}
          </strong>{' '}
          <span safe>{eventLabel(event.kind)}</span>
          <time class="ml-1.5 font-mono text-xs text-faint" datetime={event.createdAt.toISOString()} safe>
            {formatTime(event.createdAt)}
          </time>
          {event.body ? (
            <p class="mt-1 whitespace-pre-wrap rounded-md bg-bg px-3 py-2 text-sm text-fg shadow-[inset_0_0_0_1px_var(--line)]" safe>
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

const actionClass = 'rounded-md px-3 py-2 text-[13px] font-medium shadow-[inset_0_0_0_1px_var(--line)] hover:bg-bg'

function FeedbackForm({ entry, comment, error }: { entry: EntryView; comment: string; error: string | undefined }) {
  const target = `#${entryAnchor(entry.id)}`
  return (
    <form method="post" action={`/entries/${entry.id}/review`} hx-post={`/entries/${entry.id}/review`} hx-target={target} hx-swap="outerHTML" class="grid gap-2">
      {error ? <Alert kind="error" message={error} /> : ''}
      <label class="sr-only" for={`comment-${entry.id}`} safe>
        {t('review.comment')}
      </label>
      <div class="flex flex-wrap items-start gap-2">
        <textarea
          id={`comment-${entry.id}`}
          name="body"
          rows="1"
          maxlength="5000"
          placeholder={t('review.placeholder')}
          class="min-h-10 min-w-0 flex-[1_1_260px] resize-y rounded-md border-0 bg-bg px-3 py-2 text-base text-fg shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-faint sm:text-sm"
          safe
        >
          {comment}
        </textarea>
        <button name="action" value="comment" class={`${actionClass} text-fg`} safe>
          {t('review.commentButton')}
        </button>
        <button name="action" value="request-changes" class={`${actionClass} text-flag`} safe>
          {t('review.requestChanges')}
        </button>
        {entry.status === 'changes-requested' ? (
          <button name="action" value="resolve" class={`${actionClass} text-ok`} safe>
            {t('review.resolve')}
          </button>
        ) : (
          ''
        )}
      </div>
    </form>
  )
}

/** One entry as a collapsible timeline row; also the htmx fragment returned by feedback actions. */
export function EntryRow(props: { entry: EntryView; position?: number; open?: boolean } & EntryExtras) {
  const { entry, position, open = false, safeBodyHtml, tryUrl, comment = '', error } = props
  const requests = Array.isArray(entry.requests) ? (entry.requests as string[]) : []
  const media = Array.isArray(entry.media) ? (entry.media as MediaItem[]) : []
  const feedback = entry.events.filter((e) => e.body).length
  return (
    <details
      open={open}
      id={entryAnchor(entry.id)}
      class="group scroll-mt-20 rounded-[10px] bg-panel shadow-[inset_0_0_0_1px_var(--line),var(--shadow)] open:bg-panel-2"
    >
      <summary class="grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] px-4 py-3 hover:bg-panel-2 sm:grid-cols-[2rem_6.5rem_minmax(0,1fr)_auto]">
        <span class="font-mono text-xs tabular-nums text-faint" safe>
          {position === undefined ? '' : String(position).padStart(2, '0')}
        </span>
        <span class="hidden sm:inline">
          <TypeTag type={entry.type} />
        </span>
        <h3 class="min-w-0 truncate text-[15px] font-medium group-open:whitespace-normal" safe>
          {entry.title}
        </h3>
        <span class="flex items-center gap-3 font-mono text-xs text-faint">
          {entry.status === 'changes-requested' ? <ChangeRequestMarker /> : ''}
          {feedback > 0 ? (
            <span title={t('timeline.feedback', { count: feedback })} safe>
              {`${feedback} ✎`}
            </span>
          ) : (
            ''
          )}
          <time class="hidden sm:inline" datetime={entry.date} safe>
            {formatDate(entry.date)}
          </time>
        </span>
      </summary>
      <div
        class={`grid gap-6 px-4 pb-5 pt-2 sm:pl-[3.75rem] ${media.length > 0 ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''}`}
      >
        <div class="grid min-w-0 content-start gap-5">
          {entry.removedAt ? <Alert kind="error" message={t('entry.removed')} /> : ''}
          {requests.length > 0 || tryUrl || entry.try ? (
            <div class="flex flex-wrap items-center gap-2">
              <span class="sm:hidden">
                <TypeTag type={entry.type} />
              </span>
              {requests.map((url, index) => (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-md px-2.5 py-1 text-[13px] shadow-[inset_0_0_0_1px_var(--line)] hover:bg-bg"
                  safe
                >
                  {requests.length > 1 ? t('entry.ticketN', { n: index + 1 }) : t('entry.ticket')}
                </a>
              ))}
              {tryUrl ? (
                <a href={tryUrl} target="_blank" rel="noopener noreferrer" class="rounded-md bg-accent px-3 py-1 text-[13px] font-semibold text-accent-fg hover:opacity-90" safe>
                  {t('entry.try')}
                </a>
              ) : entry.try ? (
                <span class="rounded-md bg-bg px-2 py-1 font-mono text-xs text-muted" safe>
                  {entry.try}
                </span>
              ) : (
                ''
              )}
            </div>
          ) : (
            ''
          )}
          <article class="prose">{safeBodyHtml}</article>
          <div class="grid gap-3 border-t border-line pt-4">
            <History events={entry.events} />
            {entry.removedAt ? '' : <FeedbackForm entry={entry} comment={comment} error={error} />}
          </div>
        </div>
        {media.length > 0 ? (
          <div class="grid min-w-0 content-start gap-4">
            {media.map((item) => (
              <MediaBlock item={item} />
            ))}
          </div>
        ) : (
          ''
        )}
      </div>
    </details>
  )
}

export function RemovedEntryPage({ user, entry, ...extras }: { user: SessionUser; entry: EntryView } & EntryExtras) {
  return (
    <Shell title={entry.title} user={user}>
      <div class="pt-8">
        <EntryRow entry={entry} open {...extras} />
      </div>
    </Shell>
  )
}
