# Spec Delta

## MODIFIED Requirements

### Requirement: Review history
Each entry section SHALL contain a collapsible history listing all events oldest first with kind, user name (or "publish" for `updated` events), time and comment text, preserving line breaks.

#### Scenario: Updated after changes requested
- **WHEN** changes were requested and a later publish changed the entry
- **THEN** the history shows the request followed by an `updated` event and the status is `awaiting-review`

## REMOVED Requirements

### Requirement: Next to review
**Reason**: The release page shows all entries with their status in the sidebar, which replaces stepping from entry to entry.
**Migration**: Use the entry links with status in the release navigation.

## ADDED Requirements

### Requirement: In-place review
A review action sent by htmx SHALL respond with the updated entry section only, including validation errors, so the page keeps its scroll position. Without htmx the action SHALL redirect to `/releases/<release>#entry-<id>`, or show the release page with the error at the entry and status `400`.

#### Scenario: htmx accept
- **WHEN** a reviewer accepts an entry with header `HX-Request: true`
- **THEN** the response is the entry's section showing status "Accepted"

#### Scenario: Plain form
- **WHEN** a reviewer accepts an entry without htmx
- **THEN** the response redirects to the entry's anchor on its release page

#### Scenario: htmx validation error
- **WHEN** a reviewer requests changes via htmx without a comment
- **THEN** the response is the entry's section with the error and the status is unchanged
