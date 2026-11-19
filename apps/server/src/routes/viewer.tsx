import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendFragment, sendHtml } from '../app.js'
import { formBody, isHtmx, safeNext } from '../http.js'
import { t, THEMES, translate, type MessageKey } from '../i18n.js'
import { renderMarkdown } from '../markdown.js'
import { mediaDir } from '../media.js'
import { appUrl, compareEntries, releaseEntries, releaseSlug, releaseSummaries, resolveTry } from '../review.js'
import { MessagePage } from '../views/auth.js'
import { entryAnchor, EntryRow, RemovedEntryPage, type EntryView } from '../views/entry.js'
import { EmptyPage, FILTERS, TimelinePage, type Filter, type TimelineSection } from '../views/timeline.js'

const reviewSchema = z.object({
  action: z.enum(['comment', 'request-changes', 'resolve']),
  body: z.string().trim().max(5000, 'review.tooLong' satisfies MessageKey),
})
const EVENT_KIND = { comment: 'comment', 'request-changes': 'changes-requested', resolve: 'resolved' } as const
const NEXT_STATUS = { comment: undefined, 'request-changes': 'changes-requested', resolve: 'open' } as const
const MEDIA_FILE = /^[0-9a-f]{64}\.(png|jpg|webp|gif|mp4|webm)$/
const YEAR = 365 * 24 * 60 * 60

const notFound = (reply: FastifyReply, what: 'release' | 'entry' | 'file') =>
  sendHtml(reply, MessagePage({ title: t('notFound.title'), message: t(`notFound.${what}`) }), 404)

const matches = (filter: Filter | undefined, entry: { type: string; status: string }) =>
  filter === undefined || (filter === 'changes-requested' ? entry.status === 'changes-requested' : entry.type === filter)

export function viewerRoutes(app: FastifyInstance) {
  const { prisma, config } = app

  const loadEntry = (id: string) =>
    prisma.entry.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } } },
    })
  const extras = (entry: EntryView, base: string | undefined) => ({ safeBodyHtml: renderMarkdown(entry.body), tryUrl: resolveTry(entry.try, base) })

  async function renderTimeline(request: FastifyRequest, reply: FastifyReply, form?: { id: string; comment: string; error: string }) {
    const show = (request.query as { show?: string }).show
    const filter = (FILTERS as readonly string[]).includes(show ?? '') ? (show as Filter) : undefined
    const [releases, entries, base] = await Promise.all([
      releaseSummaries(prisma),
      prisma.entry.findMany({
        where: { removedAt: null },
        include: { events: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } } },
      }),
      appUrl(prisma),
    ])
    if (releases.length === 0) return sendHtml(reply, EmptyPage({ user: request.user! }))

    const counts = { all: entries.length, feature: 0, fix: 0, change: 0, 'changes-requested': 0 }
    for (const entry of entries) {
      if (entry.type in counts) counts[entry.type as 'feature' | 'fix' | 'change']++
      if (entry.status === 'changes-requested') counts['changes-requested']++
    }
    const sections: TimelineSection[] = releases
      .map((summary) => ({
        summary,
        // Positions come from the full release order, so filtering never renumbers.
        entries: entries
          .filter((entry) => entry.version === summary.version)
          .sort(compareEntries)
          .map((entry, index) => ({
            ...entry,
            ...extras(entry, base),
            position: index + 1,
            ...(form?.id === entry.id && { comment: form.comment, error: form.error, open: true }),
          }))
          .filter((entry) => matches(filter, entry)),
      }))
      .filter((section) => section.entries.length > 0)
    return sendHtml(reply, TimelinePage({ user: request.user!, sections, counts, filter }), form ? 400 : 200)
  }

  app.get('/', (request, reply) => renderTimeline(request, reply))

  app.get('/releases/:release', async (request, reply) => {
    const { release } = request.params as { release: string }
    if (release !== 'unreleased' && !/^\d+\.\d+\.\d+$/.test(release)) return notFound(reply, 'release')
    const version = release === 'unreleased' ? null : release
    if (!(await prisma.entry.findFirst({ where: { version, removedAt: null }, select: { id: true } }))) return notFound(reply, 'release')
    return reply.redirect(`/#release-${releaseSlug(version)}`, 302)
  })

  app.get('/entries/:id', async (request, reply) => {
    const entry = await loadEntry((request.params as { id: string }).id)
    if (!entry) return notFound(reply, 'entry')
    if (!entry.removedAt) return reply.redirect(`/#${entryAnchor(entry.id)}`, 302)
    return sendHtml(reply, RemovedEntryPage({ user: request.user!, entry, ...extras(entry, await appUrl(prisma)) }))
  })

  app.post('/entries/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string }
    const entry = await loadEntry(id)
    if (!entry) return notFound(reply, 'entry')
    const form = formBody(request)
    const parsed = reviewSchema.safeParse(form)
    const error = !parsed.success
      ? translate(parsed.error.issues[0]?.message ?? 'review.invalid')
      : entry.removedAt
        ? t('review.removed')
        : parsed.data.action !== 'resolve' && parsed.data.body === ''
          ? t(parsed.data.action === 'request-changes' ? 'review.needChanges' : 'review.needComment')
          : undefined

    // Resolving is a no-op unless changes are requested.
    if (!error && parsed.success && !(parsed.data.action === 'resolve' && entry.status !== 'changes-requested')) {
      const { action, body } = parsed.data
      const status = NEXT_STATUS[action]
      await prisma.$transaction([
        prisma.reviewEvent.create({ data: { entryId: id, userId: request.user!.id, kind: EVENT_KIND[action], body: body || null } }),
        ...(status ? [prisma.entry.update({ where: { id }, data: { status } })] : []),
      ])
    }

    if (isHtmx(request)) {
      // htmx swaps only 2xx responses, so validation errors are answered with 200 and shown inside the row.
      const current = (await loadEntry(id))!
      const ordered = current.removedAt ? [] : await releaseEntries(prisma, current.version)
      const index = ordered.findIndex((e) => e.id === id)
      const row = EntryRow({
        entry: current,
        open: true,
        ...(index >= 0 && { position: index + 1 }),
        ...extras(current, await appUrl(prisma)),
        ...(error && { comment: form.body ?? '', error }),
      })
      return sendFragment(reply, row)
    }
    if (error) {
      if (entry.removedAt) return sendHtml(reply, RemovedEntryPage({ user: request.user!, entry, ...extras(entry, await appUrl(prisma)), error }), 400)
      return renderTimeline(request, reply, { id, comment: form.body ?? '', error })
    }
    return reply.redirect(`/#${entryAnchor(id)}`, 303)
  })

  app.post('/preferences/theme', async (request, reply) => {
    const theme = formBody(request).theme ?? ''
    if ((THEMES as readonly string[]).includes(theme)) {
      reply.header('set-cookie', `theme=${theme}; Path=/; Max-Age=${YEAR}; SameSite=Lax${config.baseUrl.startsWith('https:') ? '; Secure' : ''}`)
    }
    let back = '/'
    try {
      const referer = new URL(request.headers.referer ?? '')
      if (referer.origin === new URL(config.baseUrl).origin) back = safeNext(referer.pathname + referer.search)
    } catch {}
    return reply.redirect(back, 303)
  })

  app.get('/media/:file', async (request, reply) => {
    const { file } = request.params as { file: string }
    if (!MEDIA_FILE.test(file)) return notFound(reply, 'file')
    reply.header('cache-control', 'private, max-age=31536000, immutable')
    return reply.sendFile(file, mediaDir(config), { cacheControl: false })
  })
}
