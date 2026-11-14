# Proposal

## Why

Every later piece (CLI, publish API, viewer) reads and writes patch note entries and the project config. The format must exist and be validated in one shared place first, so all consumers agree on it and agents can write entries without guessing.

## What Changes

- Bootstrap the pnpm workspace (TypeScript, vitest) as the base for all packages.
- Add `packages/schema`: the shared contract for entries, the `.patchnotes/` layout and `patchnotes.yaml`.
- Define the entry file format: markdown with YAML frontmatter, tracker- and workflow-agnostic (request links are plain URLs).
- Define the `.patchnotes/` directory layout: `unreleased/`, one directory per released version, and a shared `media/` directory.
- Define `patchnotes.yaml`: `server`, `dir`, `appUrl`. Secrets are never part of the file.
- Expose pure parse functions that return either typed data or a list of readable errors with file and field.
- Review status is NOT part of the entry file. The server will own it, so publishing never overwrites review results.

## Capabilities

### New Capabilities

- `entry-format`: structure, fields and validation of a single patch note entry file, and the `.patchnotes/` directory layout.
- `project-config`: structure, defaults and validation of `patchnotes.yaml`.

### Modified Capabilities

None.

## Impact

- New workspace root files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`.
- New package `packages/schema` with dependencies `zod` and `yaml`.
- No runtime services, no network, no file system access in this change. The CLI change builds on it.
