# Spec Delta

## MODIFIED Requirements

### Requirement: Publish command
`patchnotes publish` SHALL run the same validation as `patchnotes check`, derive every entry's release and every ship date from the git history of the configured branch, upload media files the server is missing, then publish all entries as one snapshot together with `appUrl`, and print the counts of created, updated, unchanged and removed entries, the number of uploaded media files, the number of releases and the server URL.

#### Scenario: First publish
- **WHEN** a project with two entries merged in one commit and one image publishes to an empty server
- **THEN** stdout reports 2 created, 1 release and 1 uploaded media file, and the exit code is 0

#### Scenario: Republish without changes
- **WHEN** the same project publishes again
- **THEN** stdout reports 2 unchanged and 0 uploaded media files

#### Scenario: Missed publish heals
- **WHEN** two merges happened since the last publish
- **THEN** one publish sends both releases with their own versions and dates

## ADDED Requirements

### Requirement: Publish from the release branch only
`patchnotes publish` SHALL fail with exit code 1 and send nothing unless the project is a git repository with full history, `HEAD` is the tip of the configured branch and the patch notes directory has no uncommitted or untracked changes. The error SHALL name the failed condition.

#### Scenario: Feature branch
- **WHEN** `HEAD` is on `feature/x` and the configured branch is `main`
- **THEN** the error names `main` and the exit code is 1

#### Scenario: Shallow clone
- **WHEN** the repository is a shallow clone
- **THEN** the error says full history is needed (for example `fetch-depth: 0`) and the exit code is 1

#### Scenario: Uncommitted entry
- **WHEN** `.patchnotes/a.md` is modified but not committed
- **THEN** the error names the uncommitted change and the exit code is 1

#### Scenario: Branch missing
- **WHEN** the configured branch `master` does not exist
- **THEN** the error names `branch` and `patchnotes.yaml` and the exit code is 1

## REMOVED Requirements

### Requirement: Release dates sent
**Reason**: Dates no longer come from `release.yaml`.
**Migration**: Ship dates are sent from the git history as part of the publish command.
