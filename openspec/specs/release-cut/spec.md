# release-cut Specification

## Purpose

Turns the current unreleased entries into a release by moving them into a version directory, so a release is one command and the file location stays the single source of an entry's release.

## Requirements

### Requirement: Release unreleased entries
`patchnotes release <patch|minor|major|X.Y.Z>` SHALL move every entry file in `unreleased/` into `v<version>/`, keeping file names and content unchanged, and print the version and the number of moved entries. Media files SHALL NOT move. The command SHALL NOT run any git operation.

#### Scenario: Release three entries
- **WHEN** `unreleased/` holds three valid entries and the user runs `patchnotes release 1.4.0`
- **THEN** the three files are in `v1.4.0/` with unchanged content, `unreleased/` holds no entries, and stdout names `1.4.0` and `3`

#### Scenario: Non-entry files stay
- **WHEN** `unreleased/.gitkeep` exists during a release
- **THEN** `.gitkeep` stays in `unreleased/`

### Requirement: Version from bump keyword
A `patch`, `minor` or `major` argument SHALL bump the highest existing version directory by SemVer rules. Without any version directory the base SHALL be `0.0.0`.

#### Scenario: Minor bump
- **WHEN** `v1.2.3/` and `v1.10.0/` exist and the user runs `patchnotes release minor`
- **THEN** the entries move to `v1.11.0/`

#### Scenario: Patch bump
- **WHEN** `v1.2.3/` is the highest version and the user runs `patchnotes release patch`
- **THEN** the entries move to `v1.2.4/`

#### Scenario: Major bump
- **WHEN** `v1.2.3/` is the highest version and the user runs `patchnotes release major`
- **THEN** the entries move to `v2.0.0/`

#### Scenario: First release
- **WHEN** no version directory exists and the user runs `patchnotes release minor`
- **THEN** the entries move to `v0.1.0/`

### Requirement: Explicit version must be new and higher
An explicit `X.Y.Z` version SHALL be higher than every existing version directory. A lower or equal version SHALL fail with exit code 1. An argument that is neither a bump keyword nor `X.Y.Z` SHALL be a usage error with exit code 2.

#### Scenario: Version already exists
- **WHEN** `v1.4.0/` exists and the user runs `patchnotes release 1.4.0`
- **THEN** nothing moves, the error names `1.4.0` and the exit code is 1

#### Scenario: Lower version
- **WHEN** `v1.4.0/` exists and the user runs `patchnotes release 1.3.9`
- **THEN** nothing moves and the exit code is 1

#### Scenario: Invalid argument
- **WHEN** the user runs `patchnotes release v1.5`
- **THEN** nothing moves and the exit code is 2

### Requirement: Release requires a valid directory
Before moving anything the command SHALL run the same validation as `patchnotes check`. On any error it SHALL print the errors, move nothing and exit with code 1.

#### Scenario: Invalid entry blocks release
- **WHEN** an entry in `v1.0.0/` has a missing media file and the user runs `patchnotes release patch`
- **THEN** the error is printed, nothing moves and the exit code is 1

### Requirement: Nothing to release
When `unreleased/` holds no entries, the command SHALL fail with exit code 1 and create no version directory.

#### Scenario: Empty unreleased
- **WHEN** `unreleased/` holds no `.md` files and the user runs `patchnotes release patch`
- **THEN** the error states there is nothing to release, no version directory is created and the exit code is 1

### Requirement: No partial release
If moving any entry fails, the command SHALL move already moved entries back to `unreleased/`, remove the version directory it created and exit with code 1.

#### Scenario: Move fails midway
- **WHEN** the second of three moves fails
- **THEN** all three entries are in `unreleased/`, no `v<version>/` directory exists and the exit code is 1

### Requirement: Ship date recorded
`patchnotes release` SHALL write `release.yaml` with `date` into the new version directory: today's local date, or the date given with `--date YYYY-MM-DD`. An invalid `--date` SHALL be a usage error with exit code 2. On a failed release the file SHALL be removed together with the directory.

#### Scenario: Default date
- **WHEN** the user runs `patchnotes release 1.4.0` on 2026-11-14
- **THEN** `v1.4.0/release.yaml` contains `date: 2026-11-14`

#### Scenario: Explicit date
- **WHEN** the user runs `patchnotes release patch --date 2026-11-01`
- **THEN** the new version's `release.yaml` contains `date: 2026-11-01`

#### Scenario: Invalid date
- **WHEN** the user runs `patchnotes release patch --date 1.11.2026`
- **THEN** nothing moves and the exit code is 2
