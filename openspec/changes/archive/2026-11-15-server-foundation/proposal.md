# Proposal

## Why

The CLI can create and check entries, but there is nowhere to publish them and nothing reviewers can open. Auth, publish API and viewer all need a running server with a database, data volume and page rendering first. This change provides that base, deployable as one container per project.

## What Changes

- Add `apps/server`: a Fastify server configured only through environment variables, validated at startup.
- Persistent data in one directory (`DATA_DIR`): the SQLite database and, later, media files. The container mounts it as a volume.
- Prisma with SQLite; pending migrations are applied automatically on startup.
- Server-rendered pages with `@kitajs/html` TSX, Tailwind v4 CSS built at build time, htmx served locally (no CDN).
- `GET /healthz` for the container platform.
- Dockerfile producing one image that runs the server as a non-root user.
- Not in this change: users and login (auth), entries and publishing (publish-api), review pages (viewer-ui).

## Capabilities

### New Capabilities

- `server-runtime`: server configuration, data directory, database migrations on start, health check, static assets and container image.

### Modified Capabilities

None.

## Impact

- New app `apps/server` with dependencies fastify, @fastify/static, prisma, @prisma/client, @prisma/adapter-better-sqlite3, better-sqlite3, @kitajs/html, htmx.org, tailwindcss.
- `better-sqlite3` and `prisma` need install scripts; they are allowed in `pnpm-workspace.yaml`.
- New `Dockerfile` and `.dockerignore` at the repo root.
