# Proposal

## Why

Clicking a screenshot opens it in a new browser tab, which pulls reviewers out of the changelog. Images should open on top of the page and close back to where the reader was.

## What Changes

- Clicking an entry image opens it in a modal image viewer over the page, with its caption.
- Previous and next buttons and the arrow keys move through the images of the same entry (for example from before to after).
- Escape, the close button or a click outside the image closes the viewer; modifier clicks still open the image in a new tab.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-viewer`: image viewer for entry media.

## Impact

- `apps/server`: layout renders one `<dialog>`, `app.js` handles opening and navigation, image links lose `target="_blank"`.
