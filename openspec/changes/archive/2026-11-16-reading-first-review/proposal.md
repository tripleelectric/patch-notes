# Proposal

## Why

The app is primarily for reading what changed. Accepting every entry turns it into an approval pipeline: it creates friction and makes unread or "unaccepted" entries look like open work. Feedback is still needed, but only where something is wrong.

## What Changes

- **BREAKING**: the accept action, the "awaiting review" and "accepted" statuses, and the acceptance progress are removed.
- An entry is either fine (`open`) or has an open change request (`changes-requested`). Requesting changes needs a comment, as before.
- An open change request is cleared by publishing a changed version of the entry, or by anyone with "Mark as resolved".
- Comments stay available on every entry.
- The release page and sidebar show the number of open change requests instead of acceptance counts; the status filter only offers "Changes requested".
- Existing entries become `open` unless they have changes requested; past `accepted` events stay readable in the history.
- The demo runs in German with German content and reading-first review data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entry-review`: accept removed, resolve added, change request and in-place review adjusted.
- `review-viewer`: progress removed, filter and navigation show change requests, German interface wording.
- `publish-api`: new entries start `open`; a content change clears a change request.

## Impact

- `apps/server`: data migration of statuses, review route, views, translations.
- `examples/demo-project`, `scripts/seed-demo.mjs`: German content and new review data.
