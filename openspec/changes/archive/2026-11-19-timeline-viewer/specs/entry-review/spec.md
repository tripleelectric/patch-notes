# Spec Delta

## MODIFIED Requirements

### Requirement: In-place feedback
A review action sent by htmx SHALL respond with the updated entry row only, expanded, including validation errors, so the page keeps its scroll position. Without htmx the action SHALL redirect to `/#entry-<id>`, or show the timeline with the error at the entry and status `400`.

#### Scenario: htmx comment
- **WHEN** a reviewer comments on an entry with header `HX-Request: true`
- **THEN** the response is the entry's row showing the comment in its history

#### Scenario: Plain form
- **WHEN** a reviewer comments on an entry without htmx
- **THEN** the response redirects to the entry's anchor on the timeline

#### Scenario: htmx validation error
- **WHEN** a reviewer requests changes via htmx without a comment
- **THEN** the response is the entry's row with the error and the status is unchanged
