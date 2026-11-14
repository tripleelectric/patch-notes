# patch-notes

Patch notes as the review surface for shipped work. Tool-agnostic: works with any planning workflow (openspec, plain PRs, manual) and any ticket tracker (Asana, Linear, GitHub Issues, none).

## Problem

Work ships ticket by ticket, but gets planned and reviewed as patches. Ticket trackers have no notion of a patch, so reviewers (PM/PO) hunt through tickets, read comments, open the app and write feedback elsewhere.

## Idea

- **Entry**: one shipped change. Markdown file with frontmatter: what changed, why (link to the original request), decisions, media (before/after, video), deep link to try it.
- **Release**: a SemVer git tag grouping entries. Untagged entries live in "Unreleased".
- **Patch**: a planned release. A single ticket shipped alone is just a small release.
- **Source of truth**: files in the project repo. The viewer and integrations only read them.

## Entry format

`.patchnotes/unreleased/<id>.md`

```md
---
id: invoice-export
title: Invoice export as CSV
type: feature            # feature | fix | change
request: https://app.asana.com/0/.../123
status: awaiting-review  # awaiting-review | accepted | changes-requested
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
server: https://patchnotes.example.com
dir: .patchnotes
previewUrl: https://{branch}.preview.example.com   # optional
```

The publish token comes from env `PATCHNOTES_TOKEN`, never from the file.

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
