# Tasks

## 1. Data and config

- [x] 1.1 Add Better Auth and invite models to the Prisma schema, create the migration with `pnpm db:migration auth`, and extend config with `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; verify the short secret config test and a migrated database has the tables
- [x] 1.2 Create the Better Auth instance (prisma adapter, email and password, admin plugin, secret from env or `DATA_DIR/auth-secret`) and bootstrap the first admin; verify tests for first start, later start and secret reuse across restarts

## 2. Login and protection

- [x] 2.1 Add login and logout pages and routes, the session `preHandler` with public allowlist and admin guard, the origin check and the rate limit; verify one test per scenario in `specs/authentication/spec.md`

## 3. User management

- [x] 3.1 Add `/admin/users` with invite creation, revocation, role change and removal including last-admin and self-removal guards; verify one test per manage-users and invite-links scenario
- [x] 3.2 Add invite acceptance pages; verify accept, short password, expired, used and revoked token tests

## 4. Docs and integration

- [x] 4.1 Document the auth environment variables and user setup in README; run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate auth --strict`; verify all pass
