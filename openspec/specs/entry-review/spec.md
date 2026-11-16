# entry-review Specification

## Purpose

Captures each reviewer verdict and discussion on an entry where the entry is shown, so the team sees per entry what is accepted, what needs work and why.

## Requirements

### Requirement: Accept
Any logged-in user SHALL be able to accept an entry that is not removed, optionally with a comment. The status SHALL become `accepted` and an `accepted` event with the user SHALL be added to the history.

#### Scenario: Accept entry
- **WHEN** a reviewer accepts an entry awaiting review
- **THEN** its status is `accepted` and the history shows the reviewer's acceptance

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
