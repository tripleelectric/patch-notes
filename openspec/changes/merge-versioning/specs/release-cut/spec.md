# Spec Delta

## REMOVED Requirements

### Requirement: Release unreleased entries
**Reason**: Every merge to the configured branch is a release, derived from git history (see `release-history`).
**Migration**: Stop running `patchnotes release`; publish after each merge instead.

### Requirement: Version from bump keyword
**Reason**: Version numbers are derived from the entry types of each release.
**Migration**: None needed.

### Requirement: Explicit version must be new and higher
**Reason**: Versions can no longer be chosen by hand.
**Migration**: None needed.

### Requirement: Release requires a valid directory
**Reason**: The command is removed; `publish` still validates before sending.
**Migration**: None needed.

### Requirement: Nothing to release
**Reason**: The command is removed.
**Migration**: None needed.

### Requirement: No partial release
**Reason**: Releases no longer move files.
**Migration**: None needed.

### Requirement: Ship date recorded
**Reason**: The ship date is the release commit's date.
**Migration**: Delete every `release.yaml`.
