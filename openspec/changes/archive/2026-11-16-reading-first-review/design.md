# Design

## Context

Review model from `viewer-ui` and `patch-page`: statuses `awaiting-review`, `accepted`, `changes-requested`; accept, request changes and comment actions. See proposal.md.

## Decisions

### Two statuses
`Entry.status` becomes `open` (default) or `changes-requested`. A migration sets every other value to `open` and changes the column default. Event kinds `accepted` stay renderable in history (old data), new kind `resolved` is added.

### Resolve instead of re-accept
Without a way to close a request, entries whose problem was solved outside the entry text (e.g. a code fix only) would stay flagged forever. "Mark as resolved" is shown only while changes are requested, so the default reading view has two quiet actions: comment and request changes.

### Reading-first layout
The progress bar and status pills on every entry are removed. Only entries with an open change request get a red "Changes requested" badge; the header and sidebar show the count of open requests when non-zero. The feedback form stays at the end of each entry.
