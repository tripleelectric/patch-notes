# Spec Delta

## MODIFIED Requirements

### Requirement: Media and limits in instructions
The block SHALL explain media references with the supported extensions, SHALL state that the entry is committed on the feature branch together with the change and becomes a release when merged, and SHALL forbid a `status` field and running `publish` unless asked.

#### Scenario: Rules present
- **WHEN** the snippet is printed
- **THEN** it lists `.png` and `.webm`, mentions `status` and `publish`, and does not mention `release` or `unreleased`
