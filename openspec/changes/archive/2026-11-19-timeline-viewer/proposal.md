# Proposal

## Why

Of three design directions, the dark timeline won: one changelog stream with every patch on a time axis, compact rows that open on demand. Reviewers also want it in light and dark mode and want the page to use the screen width instead of a narrow column.

## What Changes

- **BREAKING (UI)**: `/` becomes a changelog timeline of all patches (newest first) instead of one page per patch; `/releases/<release>` redirects to that patch's position on the timeline.
- Entries are compact rows (number, type, title, flags, date) collapsed by default; opening one shows links, rendered text, media, feedback and history. Opening an entry link expands that entry.
- Filters in the header for type and open change requests, kept in the URL.
- Wide layout: up to about 1680 px; an open entry shows text and media side by side on wide screens.
- Light and dark theme: follows the system setting by default; a header toggle switches between system, light and dark and is remembered per browser.
- IBM Plex fonts served from the server itself.
- Login, invite and admin pages use the same tokens, so they follow the theme too.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-viewer`: timeline replaces release pages and navigation, filters, collapsed rows, color theme.
- `entry-review`: in-place feedback redirects to the timeline anchor.

## Impact

- `apps/server`: views rewritten on theme tokens, new client script `/assets/app.js` (theme toggle, open-on-anchor), fonts in `/assets/fonts/`, routes for `/`, `/releases/*`, `/entries/*`, `POST /preferences/theme`.
- New dev dependencies `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (copied at build).
