import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { sendHtml } from '../app.js'
import { forwardCookies, formBody, safeNext, toHeaders } from '../http.js'
import { LoginPage } from '../views/auth.js'

export const LOGIN_RATE_LIMIT = { max: 10, timeWindow: '1 minute' }

const loginSchema = z.object({ email: z.string().trim().toLowerCase(), password: z.string(), next: z.string().optional() })

export function authRoutes(app: FastifyInstance) {
  app.get('/login', async (request, reply) => {
    const next = safeNext((request.query as { next?: unknown }).next)
    if (await app.auth.api.getSession({ headers: toHeaders(request.headers) })) return reply.redirect(next, 303)
    return sendHtml(reply, LoginPage({ next }))
  })

  app.post('/login', { config: { rateLimit: LOGIN_RATE_LIMIT } }, async (request, reply) => {
    const { email, password, next } = loginSchema.parse(formBody(request))
    const response = await app.auth.api.signInEmail({ body: { email, password }, headers: toHeaders(request.headers), asResponse: true })
    if (!response.ok) {
      return sendHtml(reply, LoginPage({ next: safeNext(next), email, error: 'Invalid email or password' }), 401)
    }
    forwardCookies(response, reply)
    return reply.redirect(safeNext(next), 303)
  })

  app.post('/logout', async (request, reply) => {
    const response = await app.auth.api.signOut({ headers: toHeaders(request.headers), asResponse: true })
    forwardCookies(response, reply)
    return reply.redirect('/login', 303)
  })
}
