# patch-notes

Patch notes as the review surface for shipped work. Tool-agnostic: works with any planning workflow (openspec, plain PRs, manual) and any ticket tracker (Asana, Linear, GitHub Issues, none).

## Problem

Work ships ticket by ticket, but gets planned and reviewed as patches. Ticket trackers have no notion of a patch, so reviewers (PM/PO) hunt through tickets, read comments, open the app and write feedback elsewhere.

## Idea

- **Entry**: one shipped change. Markdown file with frontmatter: what changed, why (link to the original request), decisions, media (before/after, video), deep link to try it.
- **Release**: a SemVer version grouping entries, stored as a `vX.Y.Z/` directory. Entries not yet released live in `unreleased/`.
- **Patch**: a planned release. A single ticket shipped alone is just a small release.
- **Source of truth**: files in the project repo. The viewer and integrations only read them.

## Entry format

`.patchnotes/unreleased/<id>.md`

```md
---
id: invoice-export
title: Invoice export as CSV
type: feature            # feature | fix | change
date: 2026-11-14
requests:
  - https://app.asana.com/0/.../123
media:
  - before: media/invoice-before.png
    after: media/invoice-after.png
  - video: media/invoice-flow.webm
try: /invoices?export=1
---
## What changed
Short, non-technical summary.

## Decisions
- CSV only, no XLSX
```

Review status is not part of the file; the server owns it. Full reference: [docs/entry-format.md](docs/entry-format.md).

## Architecture

One deployment = one project (single-tenant).

```
project repo                              patch-notes server (Docker, 1 volume)
.patchnotes/*.md  --patchnotes publish-->  API  >  SQLite + media
patchnotes.yaml       (bearer token)       UI   <  reviewers (login)
```

- The project repo is the source of truth for entries. The server is a published mirror.
- `publish` sends a full snapshot and is idempotent (upsert by entry id).
- The server owns users and, later, review status and feedback.

## Configuration

`patchnotes.yaml` in the consuming project:

```yaml
dir: .patchnotes                          # default
server: https://patchnotes.example.com    # optional
appUrl: https://app.example.com           # optional, base for path try links
```

The publish token comes from env `PATCHNOTES_TOKEN`, never from the file.

## CLI

Build the CLI and install it into a consuming project (not on npm yet):

```sh
pnpm install && pnpm build                                # in this repo
pnpm add -D file:../patch-notes/packages/cli              # in the consuming project
```

Commands, run anywhere inside the project:

```sh
patchnotes new "Invoice export as CSV" --type feature \
  --request https://app.asana.com/0/1/2 --try '/invoices?export=1'
patchnotes check                 # validate entries, ids, media files; use in CI
patchnotes release minor         # or patch, major, or an explicit 1.4.0
PATCHNOTES_TOKEN=... patchnotes publish   # mirror entries and media to the server
```

- `new` writes `.patchnotes/unreleased/<id>.md` (id from the title, or `--id`) and prints its path. A path `--try` needs `appUrl` in `patchnotes.yaml`.
- `check` reports every problem at once as `path: field: message`.
- `release` runs the check, then moves all `unreleased/` entries into `vX.Y.Z/`. It does not touch git.
- `publish` runs the check, uploads media the server does not have yet and publishes all entries as one snapshot to `server` from `patchnotes.yaml`. Entries deleted from the repo disappear from the viewer; review status is kept unless an entry's content changed.
- Media: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` images and `.mp4`, `.webm` videos, up to 200 MB each.
- Exit codes: `0` success, `1` validation or operation failed, `2` invalid usage.

## Server

One container per project. Build and run:

```sh
docker build -t patch-notes .
docker run -p 3000:3000 -v patchnotes-data:/data \
  -e BASE_URL=https://patchnotes.example.com \
  -e ADMIN_EMAIL=lead@example.com -e ADMIN_PASSWORD='change-me-please' \
  patch-notes
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `BASE_URL` | yes | public URL of the server, used for links and the request origin check |
| `DATA_DIR` | no | data directory, default `/data` in the image (`./data` otherwise): SQLite database, media, generated auth secret |
| `PORT`, `HOST` | no | listen address, default `0.0.0.0:3000` |
| `AUTH_SECRET` | no | session signing secret (32+ characters); generated once into `DATA_DIR` when missing |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | no | creates the first admin when the database has no users; ignored afterwards |
| `PUBLISH_TOKEN` | no | bearer token (32+ characters) the CLI sends as `PATCHNOTES_TOKEN`; publishing is disabled without it |

Users: the first admin comes from `ADMIN_*`. Everyone else gets an invite link from an admin (`Users` page); links work once and expire after 7 days. Roles: `admin` manages users, `reviewer` reviews. There is no password reset by email: an admin removes the user and sends a new invite.

## Stack

- `packages/schema`: zod schemas for entry, config and publish payload (shared)
- `packages/cli`: `new`, `check`, `release`, `publish`
- `apps/server`: Fastify, Prisma (SQLite), Better Auth (invite-only, roles `admin` and `reviewer`), server-rendered TSX via `@kitajs/html`, htmx, Tailwind

## Roadmap

1. `entry-schema-and-config`
2. `cli-new-check-release`
3. `server-foundation`
4. `auth`
5. `publish-api` and `cli-publish`
6. `viewer-ui`
7. `agent-snippet`
