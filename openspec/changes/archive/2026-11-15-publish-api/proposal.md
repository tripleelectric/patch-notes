# Proposal

## Why

Entries live in the project repo, reviewers live on the server. `patchnotes publish` closes the gap: it mirrors the repo's patch notes, including media, to the project's server so reviewers always see the current state, while review results stay on the server.

## What Changes

- Shared publish payload schema in `packages/schema`: entries with release, body and media references by content hash, plus `appUrl` for try links.
- Server publish API under `/api/`, authenticated with a bearer token from `PUBLISH_TOKEN`:
  - `POST /api/media/missing`: which media hashes the server does not have yet.
  - `PUT /api/media/<sha256>`: upload one media file; content is verified against the hash.
  - `POST /api/publish`: replace the published snapshot; entries are upserted by id, entries no longer in the repo are marked removed, review status survives unless the entry content changed.
- Server data model for entries, media, review events and settings.
- `patchnotes publish`: runs `check`, uploads only missing media, publishes the snapshot, prints a summary.
- `patchnotes check` also rejects media files with unsupported types, so CI catches them before publish.
- Not in this change: showing entries to reviewers (viewer-ui).

## Capabilities

### New Capabilities

- `publish-api`: server endpoints and rules for receiving media and entry snapshots.
- `cli-publish`: the `patchnotes publish` command.

### Modified Capabilities

- `entry-check`: media files must have a supported type.
- `server-runtime`: new optional environment variable `PUBLISH_TOKEN`.

## Impact

- `packages/schema`: new publish payload schema and media type table.
- `apps/server`: Prisma models `Entry`, `ReviewEvent`, `Media`, `Setting` and migration; media files in `DATA_DIR/media/`.
- `packages/cli`: new `publish` command; uses `fetch` and the `PATCHNOTES_TOKEN` environment variable.
