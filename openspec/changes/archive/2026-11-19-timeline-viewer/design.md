# Design

## Context

Current viewer: one page per release with sidebar (`patch-page`, `reading-first-review`). The chosen direction is prototype C ("Timeline") from the design options, extended with a light theme and a wider layout. See proposal.md.

## Decisions

### Theme tokens in CSS, Tailwind on top
`styles.css` defines tokens (`--bg`, `--panel`, `--panel-2`, `--fg`, `--muted`, `--faint`, `--line`, `--accent`, `--feature`, `--fix`, `--change`, `--flag`, `--ok`) for light on `:root`, for dark under `prefers-color-scheme: dark` guarded by `:root:not([data-theme="light"])`, and again for `:root[data-theme="dark"]`. `@theme inline` maps them to Tailwind colors (`bg-panel`, `text-muted`, …), so views only use token classes and both themes stay in sync.

### Theme choice server-side
`POST /preferences/theme` with `theme=system|light|dark` sets a one-year `theme` cookie and redirects back (same-origin check applies). The layout renders `data-theme` from the cookie, so there is no flash of the wrong theme. The header control is a small form cycling to the next value; it works without JavaScript.

### Client script
`/assets/app.js` (served like the CSS, CSP `script-src 'self'`) does one thing htmx and HTML cannot: on load and on `hashchange`, open the `<details>` targeted by `#entry-<id>` and scroll to it. No other behavior depends on it.

### Wide layout
Container up to 1680 px. Release section: rail column (sticky label, date, counts) plus entries column. An open entry uses `xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]`: text, links, feedback left (text capped at ~72ch), media right.

### Fonts
`@fontsource/ibm-plex-sans` (400, 500, 600) and `@fontsource/ibm-plex-mono` (400, 500) woff2 files are copied into `public/assets/fonts` by `build:assets`; `@font-face` rules in `styles.css` with `font-display: swap` and system fallbacks. CSP stays `font-src 'self'` (from `default-src`).

### Data
One query loads all non-removed entries with events; grouped by version in memory, ordered with `compareReleases` and `compareEntries`. Position numbers come from the full release order before filtering.
