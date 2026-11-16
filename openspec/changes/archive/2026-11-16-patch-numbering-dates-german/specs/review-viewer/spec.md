# Spec Delta

## ADDED Requirements

### Requirement: Position numbers
Each entry on a release page SHALL show its position number, 1 to n in release order, on its section and in the navigation. Numbers SHALL stay the same when a status filter is active.

#### Scenario: Numbers in order
- **WHEN** a release has a feature and a fix
- **THEN** the feature is number 1 and the fix number 2

#### Scenario: Filtered
- **WHEN** only the second entry awaits review and the awaiting-review filter is active
- **THEN** that entry still shows number 2

### Requirement: Release date shown
A released version's page header and navigation item SHALL show its ship date: the published release date, or the newest entry date of the release when none was published. Unreleased SHALL be labelled as not yet released.

#### Scenario: Published date
- **WHEN** `1.0.0` was published with date `2026-10-15`
- **THEN** its header and navigation item show that date

#### Scenario: Fallback
- **WHEN** `1.1.0` has no published date and its newest entry is dated `2026-11-06`
- **THEN** its header shows `2026-11-06` formatted for the interface language

### Requirement: Interface language
All pages SHALL use the interface language set by `LANGUAGE` for labels, messages and date formats: English (`en`, default) or German (`de`). Entry content SHALL be shown as written.

#### Scenario: German interface
- **WHEN** the server runs with `LANGUAGE=de`
- **THEN** the login page shows "Anmelden" and statuses read "Wartet auf Review", "Akzeptiert" and "Änderungen angefragt", and dates read like `14.11.2026`
