# Spec Delta

## MODIFIED Requirements

### Requirement: Directory layout
The patch notes directory SHALL contain entry files directly as `<id>.md` and media files in `media/`. An entry's file location SHALL NOT determine its release; releases come from the git history.

#### Scenario: Flat entry
- **WHEN** an entry lives at `invoice-export.md` in the patch notes directory
- **THEN** it is a valid entry location

#### Scenario: Unreleased entry
- **WHEN** an entry lives at `unreleased/invoice-export.md`
- **THEN** resolving it fails with an error naming `unreleased` and stating that entries live directly in the patch notes directory

#### Scenario: Released entry
- **WHEN** an entry lives at `v1.4.0/invoice-export.md`
- **THEN** resolving it fails with an error naming `v1.4.0`

#### Scenario: Unknown directory
- **WHEN** an entry lives at `next/invoice-export.md`
- **THEN** resolving it fails with an error naming the directory

### Requirement: Unique entry ids
Entry ids SHALL be unique in one patch notes directory.

#### Scenario: Duplicate id
- **WHEN** two entry files declare the same id
- **THEN** validation of the entry set fails with an error naming both paths

## REMOVED Requirements

### Requirement: Release metadata
**Reason**: Ship dates come from the commit date of each release in the git history.
**Migration**: Delete every `release.yaml`; the README's migration command does it.
