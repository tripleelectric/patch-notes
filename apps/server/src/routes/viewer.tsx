import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendHtml } from '../app.js'
import { formBody } from '../http.js'
import { renderMarkdown } from '../markdown.js'
import { mediaDir } from '../media.js'
import { nextAwaiting, releaseEntries, releasePath, releaseSummaries, STATUSES, type Status } from '../review.js'
import { MessagePage } from '../views/auth.js'
import { EntryPage } from '../views/entry.js'
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

  app.get('/', async (request, reply) => {
    const releases = await releaseSummaries(prisma)
    if (releases.length === 0) return sendHtml(reply, EmptyPage({ user: request.user! }))
    return reply.redirect(releasePath(releases[0]!.version), 302)
  })

  app.get('/releases/:release', async (request, reply) => {
    const { release } = request.params as { release: string }
    if (release !== 'unreleased' && !/^\d+\.\d+\.\d+$/.test(release)) return notFound(reply, 'release')
    const version = release === 'unreleased' ? null : release
    const releases = await releaseSummaries(prisma)
    const summary = releases.find((r) => r.version === version)
    if (!summary) return notFound(reply, 'release')
    const status = (request.query as { status?: string }).status
    const filter = (STATUSES as readonly string[]).includes(status ?? '') ? (status as Status) : undefined
    const entries = await releaseEntries(prisma, version)
    return sendHtml(reply, ReleasePage({ user: request.user!, releases, summary, entries, filter }))
  })

  async function renderEntry(request: FastifyRequest, reply: FastifyReply, form: { comment?: string; error?: string } = {}) {
    const { id } = request.params as { id: string }
    const entry = await prisma.entry.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } } },
    })
    if (!entry) return notFound(reply, 'entry')
    const [ordered, appUrl] = await Promise.all([
      entry.removedAt ? Promise.resolve([]) : releaseEntries(prisma, entry.version),
      prisma.setting.findUnique({ where: { key: 'appUrl' } }),
    ])
    const tryUrl = !entry.try ? undefined : /^https?:/.test(entry.try) ? entry.try : appUrl ? appUrl.value.replace(/\/+$/, '') + entry.try : undefined
    const next = nextAwaiting(ordered, entry.id)
    const page = EntryPage({
      user: request.user!,
      entry,
      safeBodyHtml: renderMarkdown(entry.body),
      tryUrl,
      next,
      ...form,
    })
    return sendHtml(reply, page, form.error ? 400 : 200)
  }

  app.get('/entries/:id', (request, reply) => renderEntry(request, reply))

  app.post('/entries/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string }
    const form = formBody(request)
    const parsed = reviewSchema.safeParse(form)
    if (!parsed.success) return renderEntry(request, reply, { comment: form.body ?? '', error: parsed.error.issues[0]?.message ?? 'Invalid review.' })
    const { action, body } = parsed.data
    const entry = await prisma.entry.findUnique({ where: { id }, select: { removedAt: true } })
    if (!entry) return notFound(reply, 'entry')
    if (entry.removedAt) return renderEntry(request, reply, { error: 'Removed entries cannot be reviewed.' })
    if (action !== 'accept' && body === '') {
      return renderEntry(request, reply, {
        comment: body,
        error: action === 'request-changes' ? 'Describe which changes you need.' : 'Write a comment first.',
      })
    }
    await prisma.$transaction([
      prisma.reviewEvent.create({ data: { entryId: id, userId: request.user!.id, kind: EVENT_KIND[action], body: body || null } }),
      ...(action === 'comment' ? [] : [prisma.entry.update({ where: { id }, data: { status: EVENT_KIND[action] } })]),
    ])
    return reply.redirect(`/entries/${id}`, 303)
  })

  app.get('/media/:file', async (request, reply) => {
    const { file } = request.params as { file: string }
    if (!MEDIA_FILE.test(file)) return notFound(reply, 'file')
    reply.header('cache-control', 'private, max-age=31536000, immutable')
    return reply.sendFile(file, mediaDir(config), { cacheControl: false })
  })
}
