# Design

## Context

Greenfield repository. Only the README and openspec setup exist. See proposal.md for motivation. Later changes add the CLI (`packages/cli`) and the server (`apps/server`); both import this package.

## Goals / Non-Goals

**Goals:**
- One package that owns the entry and config contract, usable from Node (CLI, server).
- Pure functions: input is file content and path, output is typed data or errors. Easy to test, no I/O.

**Non-Goals:**
- Reading the file system, checking media file existence, writing entries (CLI change).
- Publish payload schema (publish-api change).
- Release ordering and version bumping (CLI release change).

## Decisions

### Workspace: pnpm + TypeScript + vitest, ESM only
Matches the preferred stack. Single root `vitest.config.ts` with projects per package. Node 22+ as engine floor. No build step for `packages/schema` within the workspace: consumers import TypeScript source via `exports`; a build is added when the CLI is published.
Alternative: tsup build from day one. Rejected until there is an external consumer.

### zod v4 for schemas
Gives types and validation from one definition, error paths per field, and `.strict()` for unknown-field rejection. Already the preferred validation library.

### `yaml` package + own frontmatter split instead of `gray-matter`
Splitting `---` frontmatter is a few lines. `gray-matter` is unmaintained and pulls `js-yaml` with its own quirks. The `yaml` package is maintained, YAML 1.2, and gives precise error messages. One YAML parser for both entries and config.

### Parse API returns a result, never throws for invalid input
`parseEntry(content, relPath)` and `parseConfig(content)` return `{ ok: true, value } | { ok: false, errors }` where each error has `file`, `field?`, `message`. `validateEntrySet(entries)` checks cross-file rules (unique ids). Callers like `check` must report all problems at once; exceptions would stop at the first.

### Release derived from directory, not frontmatter
The entry's location (`unreleased/` or `vX.Y.Z/`) is the only source of its release. Moving a file is the release operation, so there is no field that can disagree with the location. `relPath` passed to `parseEntry` is relative to the patch notes dir.

### Media paths relative to the patch notes dir root
Entries move between `unreleased/` and version directories on release. Paths relative to the entry file would break on move; paths relative to the dir root stay valid. Rejecting absolute, `..` and backslash paths here is the first line of defense, since the server later serves these files.

### Decisions and "what changed" live in the markdown body
Structured `decisions` in frontmatter was considered. Body markdown lets agents and humans write naturally; the viewer renders it. Can be promoted to frontmatter later without breaking existing files (additive field).

### Review status owned by the server
If status lived in the file, every `publish` would overwrite reviewer decisions with stale repo state. Keeping it out of the schema avoids that conflict entirely.

## Risks / Trade-offs

- [Strict unknown-field rejection blocks forward-compatible files from newer tool versions] → Acceptable while single-user; revisit with a `version` field if entries get exchanged across tool versions.
- [Calendar date validation via regex alone accepts `2026-02-31`] → Validate by round-tripping through `Date` and comparing components.
- [No build step means the package cannot be consumed outside the workspace yet] → Added in the CLI distribution change.
