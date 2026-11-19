# Spec Delta

## MODIFIED Requirements

### Requirement: Publish snapshot
`POST /api/publish` SHALL accept the full set of entries of a project, each with its frontmatter fields, release version, body and media references by hash, plus an optional `appUrl`. Every entry SHALL have a version. Every entry SHALL be validated with the entry format rules; every referenced hash SHALL exist on the server. On any error nothing SHALL change and the response SHALL be `400` listing the errors.

#### Scenario: Missing media hash
- **WHEN** an entry references a hash the server does not have
- **THEN** the response is `400` naming the entry and the hash, and no entry changes

#### Scenario: Invalid entry
- **WHEN** an entry has `type: bugfix`
- **THEN** the response is `400` naming the entry id and field `type`

#### Scenario: Entry without version
- **WHEN** an entry has version `null`
- **THEN** the response is `400` and no entry changes

### Requirement: Change requests survive publishing
New entries SHALL start as `open`. Publishing SHALL NOT change an entry's review status unless its content (frontmatter fields other than the release, body or media) changed; then the status SHALL become `open`, clearing a change request, and an `updated` event SHALL be recorded in the entry's review history. Changing an entry's release SHALL NOT change its status.

#### Scenario: Change request survives release
- **WHEN** an entry with changes requested moves from `0.3.1` to `0.7.0` without other changes
- **THEN** it still has changes requested

#### Scenario: Change request addressed
- **WHEN** an entry with changes requested is published with a changed body
- **THEN** its status becomes `open` and its history shows an `updated` event
