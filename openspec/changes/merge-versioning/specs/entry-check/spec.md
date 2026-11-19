# Spec Delta

## MODIFIED Requirements

### Requirement: Check all entries
`patchnotes check` SHALL treat every `.md` file in the patch notes directory, at any depth except inside `media/`, as an entry, validate each one against the entry format and report the errors of all files in one run. The check SHALL NOT need git.

#### Scenario: All entries valid
- **WHEN** every entry is valid
- **THEN** stdout reports the number of checked entries and the exit code is 0

#### Scenario: Errors in two files
- **WHEN** `a.md` has an invalid `type` and `b.md` has no `title`
- **THEN** both errors are printed and the exit code is 1

#### Scenario: Entry in an unknown directory
- **WHEN** `unreleased/a.md` exists
- **THEN** an error names the directory `unreleased` and the exit code is 1

#### Scenario: Non-entry files
- **WHEN** `.gitkeep` exists in the patch notes directory
- **THEN** the file is ignored

### Requirement: Unique ids checked
The check SHALL report duplicate ids, naming both files.

#### Scenario: Duplicate id
- **WHEN** `a.md` and `b.md` both declare `id: a`
- **THEN** an error names both paths and the exit code is 1

## ADDED Requirements

### Requirement: Legacy layout reported
When the patch notes directory contains `unreleased/`, a `vX.Y.Z/` directory or a `release.yaml`, the check SHALL fail with one error naming the old layout and pointing to the migration in the README.

#### Scenario: Old project
- **WHEN** `.patchnotes/v0.3.1/release.yaml` and `.patchnotes/unreleased/a.md` exist
- **THEN** an error states the layout changed and points to the migration, and the exit code is 1

## REMOVED Requirements

### Requirement: Release files checked
**Reason**: `release.yaml` no longer exists; ship dates come from git.
**Migration**: Delete every `release.yaml`; the check reports leftovers as legacy layout.
