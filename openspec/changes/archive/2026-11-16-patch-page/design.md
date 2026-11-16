# Design

## Context

Viewer from `viewer-ui`: release list page, entry page with side column, review form posting and redirecting. See proposal.md and specs/.

## Decisions

### Native `<details>` for collapsing
Each entry is `<details open id="entry-<id>">` with the title row as `<summary>`. Collapsing works without JavaScript, is keyboard accessible, and anchors open their target. History is a nested `<details>` closed by default.

### One `EntrySection` component, two uses
The release page renders a list of `EntrySection`s; the review route renders a single `EntrySection` as an htmx fragment (`hx-target` the section, `hx-swap="outerHTML"`), and the removed-entry page renders one standalone. htmx fragments for validation errors answer `200` because htmx does not swap error statuses by default.

### Sidebar as table of contents
On wide screens the sidebar is sticky with its own scroll area, holding releases and, under the current one, the entry links with status dots. On narrow screens it stays above the content.

### Data loading
`releaseEntries` loads full entries with events and user names for one release (tens of entries; one query with `include`). Bodies are rendered with markdown per request.

## Risks / Trade-offs

- [Long releases render large pages] → Media images use `loading="lazy"`; videos load metadata only when played. Revisit pagination if a release exceeds ~100 entries.
