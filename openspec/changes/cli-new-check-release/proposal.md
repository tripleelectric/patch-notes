# Proposal

## Why

`packages/schema` defines the entry and config format, but nothing uses it yet. Authors and agents need a command to create a valid entry, CI needs a command that fails on broken entries, and releasing must group unreleased entries into a version without hand-moving files. These local commands come before the server, because the project repo is the source of truth and `publish` will build on the same discovery and checks.

## What Changes

- Add `packages/cli`, a `patchnotes` command built on `@patch-notes/schema`.
- Shared CLI behavior: find the project root and `patchnotes.yaml`, report errors as `file: field: message`, stable exit codes, `--help` and `--version`.
- `patchnotes new <title> --type <type>`: scaffold a valid entry in `unreleased/`, non-interactive so agents can call it.
- `patchnotes check`: validate every entry, unique ids, media file existence and `try` paths against `appUrl`; exit non-zero on any error so CI can gate on it.
- `patchnotes release <patch|minor|major|X.Y.Z>`: run the check, then move all `unreleased/` entries into `v<version>/`. No git operations; tagging stays in the project's own release flow.
- Build the CLI into one self-contained executable file (`dist/patchnotes.js`) that consuming projects install from a local path or the git repository. No npm publishing yet.
- Not in this change: `publish` (publish-api change), interactive prompts, media upload, git tags.

## Capabilities

### New Capabilities

- `cli-conventions`: project root and config discovery, error output, exit codes, help and version, shared by all `patchnotes` commands.
- `entry-scaffolding`: creating new entry files with `patchnotes new`.
- `entry-check`: validating a whole patch notes directory with `patchnotes check`.
- `release-cut`: grouping unreleased entries into a version directory with `patchnotes release`.

### Modified Capabilities

None. The CLI applies the existing `entry-format` and `project-config` requirements without changing them.

## Impact

- New package `packages/cli` with a `patchnotes` bin. It builds on `@patch-notes/schema` and `yaml`, both bundled into the executable; argument parsing and file access use Node built-ins.
- New dev dependency for bundling the CLI (esbuild).
- First code in the repo that reads and writes the file system: it only touches `patchnotes.yaml` and the configured patch notes directory.
- `README.md` gets a usage section for the three commands.
