# patch-notes

Patch notes as the review surface for shipped work. Tool-agnostic: works with any planning workflow (openspec, plain PRs, manual) and any ticket tracker (Asana, Linear, GitHub Issues, none).

## Problem

Work ships ticket by ticket, but gets planned and reviewed as patches. Ticket trackers have no notion of a patch, so reviewers (PM/PO) hunt through tickets, read comments, open the app and write feedback elsewhere.

## Idea

- **Entry**: one shipped change. Markdown file with frontmatter: what changed, why (link to the original request), decisions, media (before/after, video), deep link to try it.
- **Release**: a SemVer git tag grouping entries. Untagged entries live in "Unreleased".
- **Patch**: a planned release. A single ticket shipped alone is just a small release.
- **Source of truth**: files in the project repo. The viewer and integrations only read them.

## Entry format

`.patchnotes/unreleased/<id>.md`

```md
---
id: invoice-export
title: Invoice export as CSV
type: feature            # feature | fix | change
request: https://app.asana.com/0/.../123
status: awaiting-review  # awaiting-review | accepted | changes-requested
media:
  - before: media/invoice-before.png
    after: media/invoice-after.png
  - video: media/invoice-flow.webm
try: /invoices?export=1
---
## What changed
Short, non-technical summary.

## Decisions
- CSV only, no XLSX
```

## Configuration

`patchnotes.config.ts` in the consuming project. Everything workflow- or tool-specific is an adapter.

```ts
export default defineConfig({
  dir: '.patchnotes',
  versioning: 'semver',
  sources: [openspec({ dir: 'openspec/changes/archive' })], // or git(), manual()
  tracker: asana({ projectId: '...' }),                      // or github(), linear(), none()
  preview: { url: 'https://{branch}.preview.example.com' },
  media: { storage: 'repo' },                                // or s3({...})
})
```

## Planned pieces

1. CLI: `patchnotes new`, `patchnotes release <major|minor|patch>`, `patchnotes build` (entries > JSON + CHANGELOG.md)
2. Media capture via Playwright (before/after screenshots, short videos)
3. Viewer: release timeline, entry detail, "needs my review" filter
4. Review actions synced back to the tracker
