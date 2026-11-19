# entry-review Specification

## Purpose

Captures each reviewer verdict and discussion on an entry where the entry is shown, so the team sees per entry what is accepted, what needs work and why.

## Requirements

### Requirement: Request changes
Any logged-in user SHALL be able to request changes on an entry that is not removed. A non-empty comment SHALL be required. The status SHALL become `changes-requested` and a `changes-requested` event with the comment SHALL be added.

#### Scenario: Request changes without comment
- **WHEN** a reviewer requests changes with an empty comment
- **THEN** the status is unchanged and an error asks for a comment

#### Scenario: Request changes
- **WHEN** a reviewer requests changes with "Export button is hard to find"
- **THEN** the status is `changes-requested` and the history shows the comment

### Requirement: Comment
Any logged-in user SHALL be able to add a non-empty comment of at most 5000 characters without changing the status.

#### Scenario: Comment
- **WHEN** a reviewer comments "Looks good, waiting for PO"
- **THEN** the history shows the comment and the status is unchanged

### Requirement: Review history
Each entry section SHALL contain a collapsible history listing all events oldest first with kind, user name (or "publish" for `updated` events), time and comment text, preserving line breaks.

#### Scenario: Updated after changes requested
- **WHEN** changes were requested and a later publish changed the entry
- **THEN** the history shows the request followed by an `updated` event and the status is `awaiting-review`

### Requirement: Resolve change request
Any logged-in user SHALL be able to mark an open change request as resolved, optionally with a comment. The status SHALL become `open` and a `resolved` event SHALL be added. The action SHALL only be offered while changes are requested.

#### Scenario: Resolve
- **WHEN** a reviewer marks a change request as resolved
- **THEN** the status is `open` and the history shows the resolution

#### Scenario: Nothing to resolve
- **WHEN** an entry has no change request
- **THEN** its section offers no resolve action and a resolve request leaves it unchanged

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
