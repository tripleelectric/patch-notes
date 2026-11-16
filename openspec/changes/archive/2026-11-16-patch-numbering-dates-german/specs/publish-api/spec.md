# Spec Delta

## ADDED Requirements

### Requirement: Release dates
The publish payload SHALL accept `releases`, a list of `{version, date}`. A successful publish SHALL replace all stored release dates with the given ones. A version listed twice or with an invalid date SHALL reject the publish with `400`.

#### Scenario: Dates stored
- **WHEN** a snapshot contains releases `1.0.0` dated `2026-10-15`
- **THEN** the server stores that date for `1.0.0`

#### Scenario: Date removed
- **WHEN** the next snapshot has no date for `1.0.0`
- **THEN** the server no longer has a stored date for `1.0.0`
