# Proposal

## Why

Patch notes show unreleased product work, so the server must only show them to people the project invited. Reviewers (PM/PO) need a simple login, and one person needs to manage who has access. There is no self sign-up: a deployment belongs to one project and its team.

## What Changes

- Email and password login with Better Auth; sessions in cookies; logout.
- Every page except login, invite acceptance, health and assets requires a session.
- Two roles: `admin` (manages users and invites, reviews) and `reviewer` (reviews).
- First admin bootstrapped from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when the database has no users.
- Invite-only access: an admin creates an invite link for an email and role; the invitee sets name and password through the link. Links expire after 7 days and work once.
- Admin user page: list users, change roles, remove users, list and revoke pending invites. The last admin cannot be removed or demoted.
- Cross-site request protection for form posts, and rate limiting on login and invite acceptance.
- Auth secret from `AUTH_SECRET`, or generated once and kept in `DATA_DIR`.
- Not in this change: password reset by email (no mail delivery; an admin removes and re-invites), social login, API tokens (publish-api).

## Capabilities

### New Capabilities

- `authentication`: login, logout, sessions, page protection, request forgery protection and rate limiting.
- `user-management`: admin bootstrap, invites, roles and user removal.

### Modified Capabilities

- `server-runtime`: new optional environment variables `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Impact

- `apps/server`: Better Auth (with its admin plugin), `@fastify/formbody`, `@fastify/rate-limit`; Prisma models `User`, `Session`, `Account`, `Verification`, `Invite` and their migration.
- The home page now requires login.
