# Spec Delta

## REMOVED Requirements

### Requirement: Review status survives publishing
**Reason**: The statuses it names no longer exist.
**Migration**: See "Change requests survive publishing".

## ADDED Requirements

### Requirement: Change requests survive publishing
New entries SHALL start as `open`. Publishing SHALL NOT change an entry's review status unless its content (frontmatter fields other than the release, body or media) changed; then the status SHALL become `open`, clearing a change request, and an `updated` event SHALL be recorded in the entry's review history. Moving an entry to a release SHALL NOT change its status.

#### Scenario: Change request survives release
- **WHEN** an entry with changes requested moves from unreleased to `1.4.0` without other changes
- **THEN** it still has changes requested

#### Scenario: Change request addressed
- **WHEN** an entry with changes requested is published with a changed body
- **THEN** its status becomes `open` and its history shows an `updated` event
