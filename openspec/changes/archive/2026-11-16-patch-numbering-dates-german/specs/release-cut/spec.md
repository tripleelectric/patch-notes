# Spec Delta

## ADDED Requirements

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
