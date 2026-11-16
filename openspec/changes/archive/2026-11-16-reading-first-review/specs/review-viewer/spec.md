# Spec Delta

## REMOVED Requirements

### Requirement: Status filter
**Reason**: Only one status remains worth filtering.
**Migration**: Use `?status=changes-requested`; see "Change request filter".

### Requirement: Review progress
**Reason**: Acceptance no longer exists; progress towards "all accepted" has no meaning.
**Migration**: The release header shows the number of open change requests (see "Release navigation").

## MODIFIED Requirements

### Requirement: Release navigation
Every release page SHALL show all releases with entries, Unreleased first, then versions from highest to lowest, each with its entry count and, when there are any, its number of open change requests. Under the current release it SHALL list that release's entries as links to their anchors, marking entries with changes requested.

#### Scenario: Version ordering
- **WHEN** versions `1.2.0`, `1.10.0` and `1.9.1` exist
- **THEN** the release navigation lists them as `1.10.0`, `1.9.1`, `1.2.0`

#### Scenario: Entry links
- **WHEN** a user opens a release containing entry `invoice-export` with changes requested
- **THEN** the navigation links to `#entry-invoice-export` and marks it as having changes requested

### Requirement: Interface language
All pages SHALL use the interface language set by `LANGUAGE` for labels, messages and date formats: English (`en`, default) or German (`de`). Entry content SHALL be shown as written.

#### Scenario: German interface
- **WHEN** the server runs with `LANGUAGE=de`
- **THEN** the login page shows "Anmelden", a change request reads "Änderungen angefragt", and dates read like `14.11.2026`

## ADDED Requirements

### Requirement: Change request filter
A release page SHALL accept `?status=changes-requested` and then list only entries with an open change request; the filter SHALL be offered only when the release has such entries.

#### Scenario: Only change requests
- **WHEN** a user opens `/releases/unreleased?status=changes-requested`
- **THEN** only entries with changes requested are listed
