# Design

## Context

`apps/server` has `buildApp(config)`, Prisma on SQLite with an in-process migration runner, `@kitajs/html` pages. See proposal.md and specs/.

## Goals / Non-Goals

**Goals:**
- Plain HTML forms posting to our own routes; no client-side auth library.
- Better Auth owns password hashing, sessions and cookies; our code owns invites, roles and page flows.

**Non-Goals:**
- Exposing Better Auth's HTTP endpoints. They are not mounted; all calls go through `auth.api.*` on the server, which keeps the attack surface to our own routes.

## Decisions

### Better Auth via server API calls
`auth.api.signInEmail({ body, headers, asResponse: true })` and `auth.api.signOut(...)` return a `Response`; we copy its `Set-Cookie` onto the Fastify reply. `auth.api.getSession({ headers })` resolves the session in a `preHandler`. Users are created with the admin plugin's `auth.api.createUser` (allowed server-side without a session), configured with `defaultRole: 'reviewer'` and `adminRoles: ['admin']`. Role changes and removal use Prisma directly, since roles are a plain column and removal must also enforce the last-admin rule in one transaction.
Alternative: mount Better Auth's handler under `/api/auth/*` and use its client. Rejected: extra endpoints (sign-up, password change, admin) to secure and test, plus client JS.

### Route protection as a global `preHandler`
A hook resolves the session for every request and stores `request.user`. A public allowlist (`/login`, `/invite/`, `/healthz`, `/assets/`, `/api/`) skips the redirect. `/admin/` additionally requires `role === 'admin'`. Default-deny means new pages are protected without extra code.

### Origin check for form posts
Cookies are `SameSite=Lax` (Better Auth default), which already blocks cross-site POSTs in modern browsers. An `onRequest` hook additionally rejects unsafe methods outside `/api/` whose `Origin` (or `Referer`) does not match `BASE_URL`'s origin. No CSRF tokens needed for same-origin forms and htmx.

### Invites in our own table
`Invite { id, email, role, tokenHash, expiresAt, acceptedAt, createdById, createdAt }`. Token: 32 random bytes, base64url; only its SHA-256 is stored, lookup by hash. Acceptance runs in this order: load and validate invite, validate form, `createUser`, mark accepted (`updateMany where acceptedAt is null` to win races), sign in.

### Secret handling
`AUTH_SECRET` from env, else `DATA_DIR/auth-secret` created with mode `0600` from 32 random bytes. Kept alongside the database, so a backup of the volume keeps sessions valid.

### Rate limiting
`@fastify/rate-limit` registered with `global: false`; `POST /login` and `POST /invite/:token` get `{ max: 10, timeWindow: '1 minute' }` keyed by IP. In-memory store is enough for one process.

## Risks / Trade-offs

- [Better Auth internals change between versions] → Only documented `auth.api` methods are used; version pinned via lockfile; flows covered by tests through `app.inject`.
- [Admin forgets password] → Another admin removes and re-invites. A sole admin who is locked out deletes their user row with SQLite (cascades to sessions and account) and restarts with `ADMIN_*` set, which bootstraps again only if no users remain.
