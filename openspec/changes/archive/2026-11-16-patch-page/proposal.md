# Proposal

## Why

Reviewers read a patch like game patch notes: one long page per patch, scrolled top to bottom, jumping between sections from a sidebar. The current viewer splits a patch into a list page plus one page per entry, so reviewing a patch means clicking in and out of every entry.

## What Changes

- **BREAKING (UI)**: the release page shows every entry in full: links, media, description, review form and history. Each entry is a collapsible section.
- The sidebar lists all patches; under the selected patch it lists its entries as jump links with their review status.
- Review actions update the entry's section in place (htmx); without JavaScript they redirect back to the entry's position on the patch page.
- `/entries/<id>` becomes a permalink that redirects to the entry's section on its patch page; removed entries keep a standalone notice page.
- The "next to review" link is dropped: the sidebar shows all statuses at once.
- The demo container restarts automatically after a Docker daemon restart.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-viewer`: release page shows full entries, navigation lists entries, entry page becomes a permalink.
- `entry-review`: history shown per entry section, in-place review updates, next-to-review removed.

## Impact

- `apps/server`: viewer routes and views restructured; no data model change.
- `scripts/demo.sh`: restart policy.
