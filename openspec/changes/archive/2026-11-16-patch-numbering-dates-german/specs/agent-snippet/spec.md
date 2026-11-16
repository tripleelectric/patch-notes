# Spec Delta

## ADDED Requirements

### Requirement: Content language
The snippet SHALL tell agents to write titles and bodies in the configured language and SHALL name the body headings in that language.

#### Scenario: German project
- **WHEN** `patchnotes.yaml` sets `language: de`
- **THEN** the snippet says to write entries in German and lists `## Was hat sich geändert`
