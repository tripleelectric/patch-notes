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
The entry page SHALL list all events oldest first with kind, user name (or "publish" for `updated` events), time and comment text, preserving line breaks.

#### Scenario: Updated after changes requested
- **WHEN** changes were requested and a later publish changed the entry
- **THEN** the history shows the request followed by an `updated` event and the status is `awaiting-review`

### Requirement: Next to review
The entry page SHALL link to the next entry awaiting review in the same release, following the release list order and wrapping around, or state that nothing else awaits review.

#### Scenario: Next entry
- **WHEN** entries `a`, `b` and `c` await review in one release and the user views `b`
- **THEN** the page links to `c`
