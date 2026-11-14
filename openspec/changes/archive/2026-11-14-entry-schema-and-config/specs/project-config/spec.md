# Spec Delta

## Purpose

Defines the per-project `patchnotes.yaml` file that tells the tooling where entries live, which server to publish to and how to build links into the app, without holding any secrets.

## ADDED Requirements

### Requirement: Config file
Project configuration SHALL be read from a YAML file named `patchnotes.yaml` at the project root.

#### Scenario: Valid config
- **WHEN** `patchnotes.yaml` holds valid fields
- **THEN** parsing returns the typed config

#### Scenario: Malformed YAML
- **WHEN** `patchnotes.yaml` is not valid YAML
- **THEN** parsing fails with an error that includes the YAML error message

### Requirement: Config fields and defaults
The config SHALL support `dir` (relative path, default `.patchnotes`), `server` (optional absolute `http`/`https` URL of the patch-notes server) and `appUrl` (optional absolute `http`/`https` URL used to resolve path `try` links). An empty file SHALL yield all defaults.

#### Scenario: Empty file
- **WHEN** `patchnotes.yaml` is empty
- **THEN** parsing returns `dir: .patchnotes` and no `server` or `appUrl`

#### Scenario: Invalid server URL
- **WHEN** `server` is `patchnotes.example.com`
- **THEN** parsing fails with an error naming the field `server`

#### Scenario: Directory escapes project
- **WHEN** `dir` is `../notes` or an absolute path
- **THEN** parsing fails with an error naming the field `dir`

### Requirement: Unknown config fields rejected
Fields not defined by this spec SHALL be rejected.

#### Scenario: Typo
- **WHEN** the config has `sever` instead of `server`
- **THEN** parsing fails with an error naming `sever` as unknown

### Requirement: No secrets in config
The config SHALL NOT accept a publish token. Tokens are supplied through the environment only.

#### Scenario: Token in file
- **WHEN** the config has a `token` field
- **THEN** parsing fails with an error stating tokens belong in the `PATCHNOTES_TOKEN` environment variable
