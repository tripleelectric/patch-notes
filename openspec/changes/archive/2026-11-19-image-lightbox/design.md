# Design

## Decisions

### Native `<dialog>` with `showModal()`
Focus trapping, Escape handling, the backdrop and top-layer stacking come from the browser. The layout renders one dialog per page; `app.js` fills image and caption on open. Event delegation on `document` keeps working after htmx swaps the body or an entry row.

### Grouping by entry
Image links carry `data-lightbox="<entry id>"`; the viewer collects all links with the same value in document order, so before/after pairs and multiple screenshots of one entry form a sequence.

### CSP
No inline scripts or styles: the dialog and its backdrop are styled with Tailwind classes and `::backdrop` via the `backdrop:` variant; behavior lives in `/assets/app.js`.
