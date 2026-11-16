# Spec Delta

## MODIFIED Requirements

### Requirement: Config fields and defaults
The config SHALL support `dir` (relative path, default `.patchnotes`), `server` (optional absolute `http`/`https` URL of the patch-notes server), `appUrl` (optional absolute `http`/`https` URL used to resolve path `try` links) and `language` (`en` or `de`, default `en`, the language entries are written in). An empty file SHALL yield all defaults.

#### Scenario: Empty file
- **WHEN** `patchnotes.yaml` is empty
- **THEN** parsing returns `dir: .patchnotes`, `language: en` and no `server` or `appUrl`

#### Scenario: Invalid server URL
- **WHEN** `server` is `patchnotes.example.com`
- **THEN** parsing fails with an error naming the field `server`

#### Scenario: Directory escapes project
- **WHEN** `dir` is `../notes` or an absolute path
- **THEN** parsing fails with an error naming the field `dir`

#### Scenario: Unsupported language
- **WHEN** `language` is `fr`
- **THEN** parsing fails with an error naming the field `language`
