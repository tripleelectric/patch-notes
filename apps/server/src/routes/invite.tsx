import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { sendHtml } from '../app.js'
import { createUser, MIN_PASSWORD, type Role } from '../auth.js'
import { forwardCookies, formBody, toHeaders } from '../http.js'
import { t, translate } from '../i18n.js'
import { InvitePage, MessagePage } from '../views/auth.js'
import { hashToken } from './admin.js'
import { LOGIN_RATE_LIMIT } from './auth.js'

const acceptSchema = z
  .object({
    name: z.string().trim().min(1, 'invite.nameRequired').max(100, 'invite.nameTooLong'),
    password: z.string().min(MIN_PASSWORD, 'invite.passwordShort').max(128, 'invite.passwordLong'),
    confirm: z.string(),
  })
  .refine((form) => form.password === form.confirm, 'invite.mismatch')

export function inviteRoutes(app: FastifyInstance) {
  const { prisma } = app

  const findInvite = (token: string) =>
    prisma.invite.findFirst({ where: { tokenHash: hashToken(token), acceptedAt: null, expiresAt: { gt: new Date() } } })

  const invalid = (reply: FastifyReply) =>
    sendHtml(reply, MessagePage({ title: t('invite.invalidTitle'), message: t('invite.invalidMessage') }), 404)

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
      const message = parsed.error.issues[0]?.message ?? 'invite.checkInput'
      const error = message === 'invite.passwordShort' ? t('invite.passwordShort', { min: MIN_PASSWORD }) : translate(message)
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
