# Spec Delta

## Purpose

Lets a project push its patch notes and media to its patch-notes server with one command, from a developer machine or CI, without storing secrets in the repo.

## ADDED Requirements

### Requirement: Publish command
`patchnotes publish` SHALL run the same validation as `patchnotes check`, then upload media files the server is missing, then publish all entries as one snapshot together with `appUrl`, and print the counts of created, updated, unchanged and removed entries, the number of uploaded media files and the server URL.

#### Scenario: First publish
- **WHEN** a project with two entries and one image publishes to an empty server
- **THEN** stdout reports 2 created and 1 uploaded media file, and the exit code is 0

#### Scenario: Republish without changes
- **WHEN** the same project publishes again
- **THEN** stdout reports 2 unchanged and 0 uploaded media files

### Requirement: Server and token required
The command SHALL read the server URL from `server` in `patchnotes.yaml` and the token from the environment variable `PATCHNOTES_TOKEN`. When either is missing it SHALL exit with code 1 and name what is missing, without contacting any server.

#### Scenario: No token
- **WHEN** `PATCHNOTES_TOKEN` is not set
- **THEN** the error names `PATCHNOTES_TOKEN` and the exit code is 1

#### Scenario: No server
- **WHEN** `patchnotes.yaml` has no `server`
- **THEN** the error names `server` and `patchnotes.yaml` and the exit code is 1

### Requirement: No publish of invalid entries
When validation fails the command SHALL print the errors, exit with code 1 and send nothing.

#### Scenario: Missing media file
- **WHEN** an entry references a missing media file
- **THEN** nothing is sent and the exit code is 1

### Requirement: Server errors reported
When the server rejects a request or cannot be reached, the command SHALL print the server's error or the connection error and exit with code 1. The token SHALL never be printed.

#### Scenario: Wrong token
- **WHEN** the server answers `401`
- **THEN** stderr says the token was rejected and the exit code is 1
