# Design

## Context

Server has sessions, `@kitajs/html` layout with Tailwind and htmx, published `Entry`, `ReviewEvent`, `Media`, `Setting` rows and media files at `DATA_DIR/media/<sha256>.<ext>`. See proposal.md and specs/.

## Goals / Non-Goals

**Goals:**
- Plain server-rendered pages and forms (post, redirect, get); htmx `hx-boost` on the body makes navigation and forms feel instant without custom client code.
- A reviewer can go through a release entry by entry without returning to the list.

**Non-Goals:**
- Client-side state, live updates, notifications.

## Decisions

### Information architecture
Two levels: release page (list) and entry page (detail). A left sidebar on wide screens (a top bar on narrow ones) holds the release navigation with counts. The entry page has a main column (body and media) and a side column with status, actions, "next to review" and history, so the verdict is always next to the content.

### Markdown with markdown-it
`markdown-it` with `html: false` (raw HTML is escaped), `linkify: true`, and a `validateLink` that allows only `http:`, `https:`, `mailto:` and relative URLs. Its output is the one place where generated HTML is inserted unescaped; the variable is named `safe…` per `@kitajs/ts-html-plugin` convention and covered by the hostile-content test.

### Media route
`GET /media/:file` validates `^[0-9a-f]{64}\.(png|jpg|webp|gif|mp4|webm)$`, then `reply.sendFile(file, mediaDir)` from `@fastify/static`, which sets content type from the extension, handles `Range` and `ETag`. `Cache-Control: private, max-age=31536000, immutable` because the name is the content hash. The route sits behind the session guard.

### Review actions
One route `POST /entries/:id/review` with `action` = `accept` | `request-changes` | `comment`, validated with zod, executed in a transaction (status update plus event). Redirect `303` back to the entry. Errors re-render the entry page with status `400` and the comment text kept.

### Ordering
Release list order: type (feature, fix, change), then `date` descending, then title. Versions sorted numerically by their three components. The same order drives "next to review".

### Status presentation
Text label plus color (amber awaiting, emerald accepted, rose changes requested) so status is not conveyed by color alone.

## Risks / Trade-offs

- [Server time zone in event times] → Times are rendered in UTC with the suffix "UTC"; `<time datetime>` carries the exact instant.

## Implementation Notes

- Entry pages drop the release sidebar so the review column sits next to the content from 1024 px; with the sidebar it only fit from 1280 px and the review form ended up below long entries.
- The progress bar is an SVG: inline `style` attributes would be blocked by the CSP.
