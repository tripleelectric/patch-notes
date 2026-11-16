import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendFragment, sendHtml } from '../app.js'
import { formBody, isHtmx } from '../http.js'
import { renderMarkdown } from '../markdown.js'
import { mediaDir } from '../media.js'
import { appUrl, releaseEntries, releasePath, releaseSummaries, resolveTry, STATUSES, type Status } from '../review.js'
import { MessagePage } from '../views/auth.js'
import { entryAnchor, EntrySection, RemovedEntryPage, type EntryView } from '../views/entry.js'
import { EmptyPage, ReleasePage } from '../views/release.js'

const reviewSchema = z.object({
  action: z.enum(['accept', 'request-changes', 'comment']),
  body: z.string().trim().max(5000, 'Comments can have at most 5000 characters.'),
})
const EVENT_KIND = { accept: 'accepted', 'request-changes': 'changes-requested', comment: 'comment' } as const
const MEDIA_FILE = /^[0-9a-f]{64}\.(png|jpg|webp|gif|mp4|webm)$/

const notFound = (reply: FastifyReply, what: string) =>
  sendHtml(reply, MessagePage({ title: 'Not found', message: `This ${what} does not exist.` }), 404)

export function viewerRoutes(app: FastifyInstance) {
  const { prisma, config } = app

  const loadEntry = (id: string) =>
    prisma.entry.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } } },
    })
  const extras = (entry: EntryView, base: string | undefined) => ({ safeBodyHtml: renderMarkdown(entry.body), tryUrl: resolveTry(entry.try, base) })

  async function renderRelease(
    request: FastifyRequest,
    reply: FastifyReply,
    version: string | null,
    form?: { id: string; comment: string; error: string },
  ) {
    const releases = await releaseSummaries(prisma)
    const summary = releases.find((r) => r.version === version)
    if (!summary) return notFound(reply, 'release')
    const status = (request.query as { status?: string }).status
    const filter = (STATUSES as readonly string[]).includes(status ?? '') ? (status as Status) : undefined
    const base = await appUrl(prisma)
    const entries = (await releaseEntries(prisma, version)).map((entry) => ({
      ...entry,
      ...extras(entry, base),
      ...(form?.id === entry.id && { comment: form.comment, error: form.error }),
    }))
    return sendHtml(reply, ReleasePage({ user: request.user!, releases, summary, entries, filter }), form ? 400 : 200)
  }

  app.get('/', async (request, reply) => {
    const releases = await releaseSummaries(prisma)
    if (releases.length === 0) return sendHtml(reply, EmptyPage({ user: request.user! }))
    return reply.redirect(releasePath(releases[0]!.version), 302)
  })

  app.get('/releases/:release', async (request, reply) => {
    const { release } = request.params as { release: string }
    if (release !== 'unreleased' && !/^\d+\.\d+\.\d+$/.test(release)) return notFound(reply, 'release')
    return renderRelease(request, reply, release === 'unreleased' ? null : release)
  })

  app.get('/entries/:id', async (request, reply) => {
    const entry = await loadEntry((request.params as { id: string }).id)
    if (!entry) return notFound(reply, 'entry')
    if (!entry.removedAt) return reply.redirect(`${releasePath(entry.version)}#${entryAnchor(entry.id)}`, 302)
    return sendHtml(reply, RemovedEntryPage({ user: request.user!, entry, ...extras(entry, await appUrl(prisma)) }))
  })

  app.post('/entries/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string }
    const entry = await loadEntry(id)
    if (!entry) return notFound(reply, 'entry')
    const form = formBody(request)
    const parsed = reviewSchema.safeParse(form)
    const error = !parsed.success
      ? (parsed.error.issues[0]?.message ?? 'Invalid review.')
      : entry.removedAt
        ? 'Removed entries cannot be reviewed.'
        : parsed.data.action !== 'accept' && parsed.data.body === ''
          ? parsed.data.action === 'request-changes'
            ? 'Describe which changes you need.'
            : 'Write a comment first.'
          : undefined

    if (!error && parsed.success) {
      const { action, body } = parsed.data
      await prisma.$transaction([
        prisma.reviewEvent.create({ data: { entryId: id, userId: request.user!.id, kind: EVENT_KIND[action], body: body || null } }),
        ...(action === 'comment' ? [] : [prisma.entry.update({ where: { id }, data: { status: EVENT_KIND[action] } })]),
      ])
    }

    if (isHtmx(request)) {
      // htmx swaps only 2xx responses, so validation errors are answered with 200 and shown inside the section.
      const current = (await loadEntry(id))!
      const section = EntrySection({ entry: current, ...extras(current, await appUrl(prisma)), ...(error && { comment: form.body ?? '', error }) })
      return sendFragment(reply, section)
    }
    if (error) {
      if (entry.removedAt) return sendHtml(reply, RemovedEntryPage({ user: request.user!, entry, ...extras(entry, await appUrl(prisma)), error }), 400)
      return renderRelease(request, reply, entry.version, { id, comment: form.body ?? '', error })
    }
    return reply.redirect(`${releasePath(entry.version)}#${entryAnchor(id)}`, 303)
  })

  app.get('/media/:file', async (request, reply) => {
    const { file } = request.params as { file: string }
    if (!MEDIA_FILE.test(file)) return notFound(reply, 'file')
    reply.header('cache-control', 'private, max-age=31536000, immutable')
    return reply.sendFile(file, mediaDir(config), { cacheControl: false })
  })
}
