# Tasks

## 1. Review model

- [x] 1.1 Migrate statuses to `open` and `changes-requested`, make publish set `open` on content change, replace accept with resolve in the review route; verify one test per scenario in the entry-review and publish-api deltas

## 2. Viewer

- [x] 2.1 Remove progress and acceptance labels, show open change request counts in header and sidebar, limit the filter to change requests, update translations; verify the release navigation, status filter and German interface scenarios

## 3. Demo and integration

- [x] 3.1 Translate the demo project to German with release dates and reading-first review data, run the demo with `LANGUAGE=de`; run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate reading-first-review --strict`; check the rendered pages
