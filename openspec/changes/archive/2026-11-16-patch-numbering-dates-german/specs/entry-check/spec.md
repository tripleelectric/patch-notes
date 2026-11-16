# Spec Delta

## ADDED Requirements

### Requirement: Release files checked
`patchnotes check` SHALL validate every `release.yaml` in version directories against the release metadata format and report a `release.yaml` in `unreleased/` as an error.

#### Scenario: Invalid release date
- **WHEN** `v1.0.0/release.yaml` contains `date: tomorrow`
- **THEN** an error names `v1.0.0/release.yaml` and the field `date`, and the exit code is 1

#### Scenario: Release file in unreleased
- **WHEN** `unreleased/release.yaml` exists
- **THEN** an error names the file and the exit code is 1
