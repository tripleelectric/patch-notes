# Spec Delta

## REMOVED Requirements

### Requirement: In-place review
**Reason**: Replaced because its accept scenarios no longer apply.
**Migration**: Same behavior for comments, change requests and resolving; see "In-place feedback".

### Requirement: Accept
**Reason**: Entries are read, not approved; accepting each one adds friction without value.
**Migration**: No action needed. Entries without a change request are considered fine.

## MODIFIED Requirements

### Requirement: Request changes
Any logged-in user SHALL be able to request changes on an entry that is not removed. A non-empty comment SHALL be required. The status SHALL become `changes-requested` and a `changes-requested` event with the comment SHALL be added.

#### Scenario: Request changes without comment
- **WHEN** a reviewer requests changes with an empty comment
- **THEN** the status is unchanged and an error asks for a comment

#### Scenario: Request changes
- **WHEN** a reviewer requests changes with "Export button is hard to find"
- **THEN** the status is `changes-requested` and the history shows the comment

## ADDED Requirements

### Requirement: Resolve change request
Any logged-in user SHALL be able to mark an open change request as resolved, optionally with a comment. The status SHALL become `open` and a `resolved` event SHALL be added. The action SHALL only be offered while changes are requested.

#### Scenario: Resolve
- **WHEN** a reviewer marks a change request as resolved
- **THEN** the status is `open` and the history shows the resolution

#### Scenario: Nothing to resolve
- **WHEN** an entry has no change request
- **THEN** its section offers no resolve action and a resolve request leaves it unchanged

### Requirement: In-place feedback
A review action sent by htmx SHALL respond with the updated entry section only, including validation errors, so the page keeps its scroll position. Without htmx the action SHALL redirect to `/releases/<release>#entry-<id>`, or show the release page with the error at the entry and status `400`.

#### Scenario: htmx comment
- **WHEN** a reviewer comments on an entry with header `HX-Request: true`
- **THEN** the response is the entry's section showing the comment in its history

#### Scenario: Plain form
- **WHEN** a reviewer comments on an entry without htmx
- **THEN** the response redirects to the entry's anchor on its release page

#### Scenario: htmx validation error
- **WHEN** a reviewer requests changes via htmx without a comment
- **THEN** the response is the entry's section with the error and the status is unchanged
