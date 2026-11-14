# Tasks

## 1. Building blocks

- [x] 1.1 Add markdown rendering with link validation and the media route; verify the script-in-body, anonymous media and video range scenarios

## 2. Pages

- [x] 2.1 Add default release redirect, release page, progress, status filter and release navigation; verify one test per scenario of those requirements in `specs/review-viewer/spec.md`
- [x] 2.2 Add the entry page with media, try link and removed notice; verify the before/after, removed entry and try link scenarios

## 3. Review

- [x] 3.1 Add accept, request changes and comment with history and next-to-review; verify one test per scenario in `specs/entry-review/spec.md`

## 4. Integration

- [x] 4.1 Run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate viewer-ui --strict`; verify all pass and the pages render in a browser against seeded data
