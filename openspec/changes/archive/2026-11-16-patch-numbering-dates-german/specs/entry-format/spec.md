# Spec Delta

## ADDED Requirements

### Requirement: Release metadata
A version directory MAY contain `release.yaml` with exactly one field, `date`, a calendar date in `YYYY-MM-DD` format, stating when the release shipped. Unknown fields SHALL be rejected. `release.yaml` SHALL NOT appear in `unreleased/`.

#### Scenario: Valid release file
- **WHEN** `v1.4.0/release.yaml` contains `date: 2026-11-14`
- **THEN** parsing returns the date `2026-11-14`

#### Scenario: Invalid date
- **WHEN** `release.yaml` contains `date: 2026-02-30`
- **THEN** parsing fails with an error naming the field `date`
