import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { sendHtml } from '../app.js'
import { createUser, MIN_PASSWORD, type Role } from '../auth.js'
import { forwardCookies, formBody, toHeaders } from '../http.js'
import { InvitePage, MessagePage } from '../views/auth.js'
import { hashToken } from './admin.js'
import { LOGIN_RATE_LIMIT } from './auth.js'

const acceptSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(100, 'Name is too long.'),
    password: z.string().min(MIN_PASSWORD, `Password needs at least ${MIN_PASSWORD} characters.`).max(128, 'Password is too long.'),
    confirm: z.string(),
  })
  .refine((form) => form.password === form.confirm, 'Passwords do not match.')

export function inviteRoutes(app: FastifyInstance) {
  const { prisma } = app

  const findInvite = (token: string) =>
    prisma.invite.findFirst({ where: { tokenHash: hashToken(token), acceptedAt: null, expiresAt: { gt: new Date() } } })

  const invalid = (reply: FastifyReply) =>
    sendHtml(reply, MessagePage({ title: 'Invite invalid', message: 'This invite link is invalid or expired. Ask an admin for a new one.' }), 404)

  app.get('/invite/:token', async (request, reply) => {
    const { token } = request.params as { token: string }
    const invite = await findInvite(token)
    if (!invite) return invalid(reply)
    return sendHtml(reply, InvitePage({ email: invite.email, action: `/invite/${token}` }))
  })

  app.post('/invite/:token', { config: { rateLimit: LOGIN_RATE_LIMIT } }, async (request, reply) => {
    const { token } = request.params as { token: string }
    const invite = await findInvite(token)
    if (!invite) return invalid(reply)

    const form = formBody(request)
    const parsed = acceptSchema.safeParse(form)
    if (!parsed.success) {
      const error = parsed.error.issues[0]?.message ?? 'Check your input.'
      return sendHtml(reply, InvitePage({ email: invite.email, action: `/invite/${token}`, name: form.name ?? '', error }), 400)
    }

    // Claim the invite first so two parallel submissions cannot both create a user.
    const claimed = await prisma.invite.updateMany({ where: { id: invite.id, acceptedAt: null }, data: { acceptedAt: new Date() } })
    if (claimed.count === 0) return invalid(reply)
    const { name, password } = parsed.data
    try {
      await createUser(app.auth, { email: invite.email, password, name, role: invite.role as Role })
    } catch (error) {
      await prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: null } })
      throw error
    }

    const response = await app.auth.api.signInEmail({ body: { email: invite.email, password }, headers: toHeaders(request.headers), asResponse: true })
    forwardCookies(response, reply)
    return reply.redirect('/', 303)
  })
}
