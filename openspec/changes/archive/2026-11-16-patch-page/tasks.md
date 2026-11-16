# Tasks

## 1. Patch page

- [x] 1.1 Build `EntrySection` and the single-page release view with collapsible entries and the entry table of contents in the sidebar; verify the release page and release navigation scenarios
- [x] 1.2 Turn `/entries/:id` into a permalink with the removed-entry page; verify the permalink, removed entry and before/after scenarios
- [x] 1.3 Make review actions respond in place for htmx and redirect to the anchor otherwise; verify the in-place review and history scenarios

## 2. Demo and integration

- [x] 2.1 Add `--restart unless-stopped` to the demo container, run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate patch-page --strict`, restart the demo and check the page rendering
