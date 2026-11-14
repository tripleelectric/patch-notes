# Proposal

## Why

Published entries are stored on the server but nobody can see them yet. PM/PO need one place to read what shipped in a patch, look at before/after media, try it, and give a verdict per entry instead of hunting through tracker tickets.

## What Changes

- Release overview: Unreleased and every released version, with per-release review progress, and the entries of a release grouped as features, fixes and changes.
- Entry page: rendered description, request links, a "Try it" link resolved against `appUrl`, media (images, before/after side by side, videos), review status and history.
- Review actions for every logged-in user: accept, request changes (with a required comment) and comment. A "next to review" link moves through the release.
- Media served from the data directory to logged-in users only.
- Pages work without JavaScript; htmx boosts navigation and forms.
- Not in this change: notifications, editing entries in the browser (the repo is the source of truth).

## Capabilities

### New Capabilities

- `review-viewer`: release overview, entry page, media delivery.
- `entry-review`: review status changes, comments and history.

### Modified Capabilities

None.

## Impact

- `apps/server`: new routes and views, `markdown-it` for entry bodies, media route.
