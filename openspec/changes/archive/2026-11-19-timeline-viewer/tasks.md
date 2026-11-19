# Tasks

## 1. Foundations

- [x] 1.1 Add theme tokens, `@theme inline` mapping, self-hosted IBM Plex fonts, `/assets/app.js` and the theme preference route with cookie-driven `data-theme`; verify the color theme scenarios and that assets return `200`

## 2. Timeline

- [x] 2.1 Build the timeline page with release rail, collapsed entry rows, wide expanded layout and header filters; redirect `/releases/*` and `/entries/*`; verify one test per scenario of the changelog timeline, release rail, collapsed entries, timeline filters, release links, entry permalink, position numbers and release date requirements
- [x] 2.2 Return expanded entry rows for htmx feedback and redirect plain forms to `/#entry-<id>`; verify the in-place feedback scenarios

## 3. Remaining pages and integration

- [x] 3.1 Move login, invite, message and admin pages onto the theme tokens; run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate timeline-viewer --strict`; restart the demo and check light and dark renders
