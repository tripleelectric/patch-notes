# Spec Delta

## ADDED Requirements

### Requirement: Release dates sent
`patchnotes publish` SHALL send the date of every version directory that has a `release.yaml`.

#### Scenario: Dated release
- **WHEN** `v1.0.0/release.yaml` contains `date: 2026-10-15`
- **THEN** the server shows `1.0.0` as released on 2026-10-15
