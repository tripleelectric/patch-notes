# Design

## Context

Schema package (entry parser), CLI (`check`, project discovery), server (Fastify, Prisma/SQLite, auth with public `/api/` prefix). See proposal.md and specs/.

## Goals / Non-Goals

**Goals:**
- Content-addressed media: unchanged files are never uploaded twice; large videos stream to disk.
- One transaction per publish; all-or-nothing.

**Non-Goals:**
- Garbage collection of unreferenced media (cheap to keep; can be added later).
- Multiple projects or tokens per server.

## Decisions

### Payload shape, shared in `packages/schema`
```
{ appUrl?: string,
  entries: [{ path, version: string|null, data: <entry frontmatter>, body,
              media: [{ path, sha256, size, contentType }] }] }
```
`data` keeps the repo's media paths; `media` maps every referenced path to its hash. The server re-validates `data` with `entrySchema` and resolves paths to hashes when storing, so stored entries reference media only by hash. `MEDIA_TYPES` (extension to content type and kind) also lives in the schema package; CLI `check` and the server use the same table.

### Media storage
Files at `DATA_DIR/media/<sha256>.<ext>`, written to a temporary file in the same directory while hashing the stream, then renamed. The extension keeps static serving (content type, range requests for video) trivial in the viewer. A `Media` row records hash, content type and size. The request body is passed through as a stream with a content type parser per supported type, and a byte counter aborts at 200 MB.

### Change detection
`contentHash = sha256(JSON.stringify({ data, body, media }))` over the stored representation (media as hashes), which excludes `version`. Release moves change `version` only, so they update the row (`updated` count) without touching status. Content changes set `status = awaiting-review` and add a `ReviewEvent { kind: 'updated' }`.

### Token check
`PUBLISH_TOKEN` compared via `timingSafeEqual` on SHA-256 digests of both strings (equal length by construction). A route-level `onRequest` hook on the `/api/` routes; the session guard already skips `/api/`, and the origin check skips `/api/` too because the CLI is not a browser.

### CLI upload
`fetch` with `fs.openAsBlob(path)` as body streams files without loading them into memory. Requests: `POST missing` once, `PUT` per missing file sequentially (simple, bounded memory), then `POST publish`. Server error bodies `{ error, details? }` are printed; the token only lives in the `Authorization` header.

### Data model
`Entry` (id = entry id, frontmatter columns, `requests`/`media` as JSON, `body`, `path`, `version`, `contentHash`, `status`, `removedAt`, timestamps), `ReviewEvent` (entry, optional user, `kind`: `updated` now; `comment`, `accepted`, `changes-requested` in viewer-ui, `body`, `createdAt`), `Media`, `Setting` (key/value, holds `appUrl`).

## Risks / Trade-offs

- [A very large repo exceeds the JSON body limit] → Limit 20 MB of entry JSON (thousands of entries); media is separate.
- [Interrupted publish after uploads] → Uploads are idempotent and content-addressed; rerunning publishes cleanly.
