import type { IncomingHttpHeaders } from 'node:http'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { THEMES, type Theme } from './i18n.js'

export function toHeaders(raw: IncomingHttpHeaders): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(raw)) {
    for (const item of [value ?? []].flat()) headers.append(key, item)
  }
  return headers
}

/** Copies cookies set by a Better Auth `Response` onto the reply. */
export function forwardCookies(from: Response, reply: FastifyReply): void {
  const cookies = from.headers.getSetCookie()
  if (cookies.length > 0) reply.header('set-cookie', cookies)
}

/** Only same-site absolute paths, so `next` cannot redirect to another host. */
export function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/'
}

export const isHtmx = (request: FastifyRequest) => request.headers['hx-request'] === 'true'

export function formBody(request: FastifyRequest): Record<string, string> {
  const body = request.body
  if (typeof body !== 'object' || body === null) return {}
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String([value].flat()[0] ?? '')]))
}

/** Color theme chosen by the viewer (`theme` cookie), `system` when unset or unknown. */
export function themeFromCookie(cookie: string | undefined): Theme {
  const value = /(?:^|;\s*)theme=([a-z]+)/.exec(cookie ?? '')?.[1]
  return (THEMES as readonly string[]).includes(value ?? '') ? (value as Theme) : 'system'
}
