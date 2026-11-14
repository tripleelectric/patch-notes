# Design

## Context

`packages/schema` offers pure parsers (`parseEntry`, `parseConfig`, `validateEntrySet`) that take content and a path relative to the patch notes dir, and return errors with `file` relative to that dir. The workspace has no build step yet; packages export TypeScript source. This change adds the first package that touches the file system and the first build. See proposal.md for scope and specs/ for behavior.

## Goals / Non-Goals

**Goals:**
- All command logic testable in-process against temporary directories, without spawning the built binary.
- One code path for validation: `release` runs exactly what `check` runs.
- A single bundled file as the only install artifact.

**Non-Goals:**
- Shared code for `publish` beyond what falls out naturally (discovery, scanning); publish-api decides its own needs.
- Windows-specific handling beyond normalizing path separators to `/` before calling the schema.
- Colored or interactive output.

## Decisions

### Argument parsing with `node:util` `parseArgs`
Three commands with a handful of flags fit `parseArgs` in strict mode, which already rejects unknown options and supports repeatable string options (`--request`). A thin dispatcher maps the first positional to a command and turns `parseArgs` errors into exit code 2.
Alternative: commander or citty. Rejected: a dependency for what the standard library covers, and it would need to be bundled anyway.

### `run(argv, io)` entry point with injected I/O
`run` takes `argv` and `{ cwd, stdout, stderr, now }` and returns the exit code. The bin file only calls `run(process.argv.slice(2), …)` and sets `process.exitCode`. Tests call `run` against `fs.mkdtemp` directories and assert on captured output, exit code and resulting files. `now` makes the `date` of `new` deterministic.
Alternative: tests spawn the built binary. Rejected as the main strategy: slower, needs a build before every test run. One bundle smoke test covers the built file.

### Module layout
- `project`: root discovery (walk up for `patchnotes.yaml`, then `.git`, else cwd; `.git` may be a file in worktrees, so check existence, not directory type) and config loading via `parseConfig`.
- `scan`: list `.md` files under the dir (excluding `media/`), read and `parseEntry` each with a `/`-separated relative path.
- `check`: scan, then `validateEntrySet`, media checks and the `try`/`appUrl` rule. Returns entries and errors; prints nothing.
- `commands/new`, `commands/check`, `commands/release`: argument handling and output.
- `output`: formats errors as `<dir>/<file>: <field>: <message>`, prefixing the configured dir so paths are relative to the project root.

### Cross-file rules live in the CLI, not the schema
Media existence and the `appUrl` rule depend on the file system and config, which the schema package deliberately does not touch. They stay in `check`. If the server needs the same rules for uploaded snapshots, they move then.

### Media containment via `realpath`
Resolve the patch notes dir and each media path with `fs.realpath` and require the media real path to be inside the dir real path (prefix plus separator), then `stat` for a regular file. The schema already rejects `..` and absolute paths; `realpath` closes the symbolic link gap before the server ever serves these files.

### `new` validates the rendered file, then creates exclusively
The command renders the full file text (frontmatter via `yaml` `stringify`, then the body template), runs `parseEntry` on that text with its target path, checks the id against a scan of the directory, and writes with flag `wx`. Validating the exact bytes that will be written means the scaffold can never produce something `check` rejects; `wx` closes the race between the duplicate check and the write.

### Slug rules
NFKD normalize, drop combining marks, map `ß` to `ss`, lowercase, replace runs of non `[a-z0-9]` with `-`, trim `-`, cut to 80 characters and trim a trailing `-` again. No transliteration library: German and Western European titles are the realistic input, and `--id` covers the rest.

### Release: rename per file with rollback
Compute the version (own three-integer SemVer comparison and bump; no prerelease support, matching the `vX.Y.Z` directory rule), run `check`, create `v<version>/` with non-recursive `mkdir` so an existing directory fails instead of merging, then `rename` each entry. On a failure, rename moved files back in reverse order and remove the new directory. `rename` within one directory tree is atomic per file and keeps content byte-identical. Tests simulate a mid-way failure by partially mocking `node:fs/promises` `rename` with vitest.
Alternative: copy all, then delete originals. Rejected: doubles I/O and has its own partial-failure state.

### Bundle with esbuild, bundled dependencies as devDependencies
`esbuild src/bin.ts --bundle --platform=node --target=node22 --format=esm` with a `#!/usr/bin/env node` banner writes `dist/patchnotes.js`. `@patch-notes/schema`, `zod` and `yaml` are inlined, so the CLI package declares them as `devDependencies` and has no runtime `dependencies`. That keeps `pnpm add -D file:../patch-notes/packages/cli` working in a consuming project, which could not resolve the `workspace:` schema dependency. The version comes from the package's `package.json` via a JSON import with `with { type: 'json' }`, which esbuild inlines. Root gets a `build` script (`pnpm -r build`).
Alternative: tsdown/tsup. Rejected: they add declaration and multi-entry machinery an executable does not need.

## Risks / Trade-offs

- [Rollback itself can fail, e.g. permissions changed mid-run] → Print which files are where and exit 1; the user can fix by moving files manually, since content is never altered.
- [Consumers install from a local path, so updates need a rebuild and reinstall] → Accepted until npm publishing; documented in README.
- [`date` uses the machine's local date, which can differ from UTC near midnight] → Matches what the author sees; the field is editable.
- [Treating every `.md` under the dir as an entry flags a stray `README.md` at the dir root] → Intended: entries only live in release directories, and the error names the file.
