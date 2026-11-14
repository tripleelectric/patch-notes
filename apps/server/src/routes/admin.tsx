import { createHash, randomBytes } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendHtml } from '../app.js'
import { ROLES } from '../auth.js'
import { formBody } from '../http.js'
import { AdminUsersPage } from '../views/admin-users.js'

export const INVITE_DAYS = 7
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

const inviteSchema = z.object({ email: z.email().trim().toLowerCase(), role: z.enum(ROLES) })
const roleSchema = z.object({ role: z.enum(ROLES) })

export function adminRoutes(app: FastifyInstance) {
  const { prisma } = app

  async function render(request: FastifyRequest, reply: FastifyReply, extra: { inviteLink?: string; error?: string } = {}) {
    const [users, invites] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true } }),
      prisma.invite.findMany({ where: { acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } }),
    ])
    return sendHtml(reply, AdminUsersPage({ user: request.user!, users, invites, ...extra }), extra.error ? 400 : 200)
  }

  app.get('/admin/users', render)

  app.post('/admin/invites', async (request, reply) => {
    const parsed = inviteSchema.safeParse(formBody(request))
    if (!parsed.success) return render(request, reply, { error: 'Enter a valid email and role.' })
    const { email, role } = parsed.data
    if (await prisma.user.findUnique({ where: { email } })) {
      return render(request, reply, { error: `A user with ${email} already exists.` })
    }
    const token = randomBytes(32).toString('base64url')
    await prisma.$transaction([
      prisma.invite.deleteMany({ where: { email, acceptedAt: null } }),
      prisma.invite.create({
        data: {
          email,
          role,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
          createdById: request.user!.id,
        },
      }),
    ])
    return render(request, reply, { inviteLink: `${app.config.baseUrl}/invite/${token}` })
  })

  app.post('/admin/invites/:id/revoke', async (request, reply) => {
    await prisma.invite.deleteMany({ where: { id: (request.params as { id: string }).id, acceptedAt: null } })
    return reply.redirect('/admin/users', 303)
  })

  app.post('/admin/users/:id/role', async (request, reply) => {
    const parsed = roleSchema.safeParse(formBody(request))
    if (!parsed.success) return render(request, reply, { error: 'Unknown role.' })
    const { id } = request.params as { id: string }
    const error = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } })
      if (!target) return 'User not found.'
      if (target.role === 'admin' && parsed.data.role !== 'admin' && (await tx.user.count({ where: { role: 'admin' } })) <= 1) {
        return 'The last admin cannot be demoted.'
      }
      await tx.user.update({ where: { id }, data: { role: parsed.data.role } })
      return undefined
    })
    return error ? render(request, reply, { error }) : reply.redirect('/admin/users', 303)
  })

  app.post('/admin/users/:id/remove', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (id === request.user!.id) return render(request, reply, { error: 'You cannot remove yourself.' })
    const error = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } })
      if (!target) return 'User not found.'
      if (target.role === 'admin' && (await tx.user.count({ where: { role: 'admin' } })) <= 1) return 'The last admin cannot be removed.'
      await tx.user.delete({ where: { id } })
      return undefined
    })
    return error ? render(request, reply, { error }) : reply.redirect('/admin/users', 303)
  })
}
