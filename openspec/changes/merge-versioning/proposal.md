# Proposal

## Why

Teams that deploy every merge to their main branch see most entries pile up under "Unreleased" although they are already live, because a version only exists after someone runs `patchnotes release` by hand. Releases must follow the merges automatically, without a manual step, without bot commits and without version conflicts between parallel branches.

## What Changes

- Versions are derived from git history at publish time: every first-parent commit on the configured branch that adds at least one new entry id is one version, dated with its commit date. Bump per version from the types of the entries it adds: any `feature` is a minor bump, otherwise a patch bump, starting from `0.0.0`.
- **BREAKING**: entries live flat in `<dir>/<id>.md`. `unreleased/`, `vX.Y.Z/` directories and `release.yaml` are no longer valid; `patchnotes check` reports them with the migration command.
- **BREAKING**: `patchnotes release` is removed.
- New config field `branch` (default `main`) names the branch whose merges are versions.
- `patchnotes publish` only runs on a clean checkout of the configured branch with full history, so every published entry has a version and publishing from a feature branch can no longer remove entries from the server.
- **BREAKING**: the publish API requires a version for every entry; the viewer drops the "Unreleased" section and label.
- The agent snippet no longer mentions releases or released directories.
- CI-ready distribution: the bundled CLI is attached to GitHub releases of this repo, and the README documents a generic GitHub Actions workflow (push to branch, full history, `PATCHNOTES_TOKEN` secret) and the one-time migration for existing projects.

## Capabilities

### New Capabilities

- `release-history`: how versions, their order, numbers and ship dates are derived from the git history of the configured branch.

### Modified Capabilities

- `entry-format`: flat directory layout; release metadata files removed.
- `entry-check`: legacy layout reported as error with migration hint; release file checks removed.
- `entry-scaffolding`: `new` writes `<dir>/<id>.md`.
- `release-cut`: removed entirely (`patchnotes release`).
- `project-config`: new `branch` field.
- `cli-publish`: branch, clean tree and full history required; versions and dates come from git.
- `cli-conventions`: help lists no `release` command.
- `publish-api`: entry version required.
- `review-viewer`: no Unreleased section, label or link.
- `agent-snippet`: release rules replaced.

## Impact

- `packages/schema`: entry path parsing, release metadata removed, publish payload version required, config `branch`.
- `packages/cli`: new git history module, `check`, `new`, `publish`, `agent-snippet`, help; `release` command, `version.ts` bump keywords removed.
- `apps/server`: publish validation, viewer routes and timeline without unreleased, i18n keys.
- Consuming projects: one-time migration commit, `branch` in `patchnotes.yaml` when not `main`, a GitHub Actions workflow and repository secret. Existing hand-cut version numbers are replaced by derived ones; review status survives because it is keyed by entry id.
- Requires `git` on the machine that publishes.
