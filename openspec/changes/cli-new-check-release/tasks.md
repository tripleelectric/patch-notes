# Tasks

## 1. Package setup

- [x] 1.1 Create `packages/cli` (`package.json` with `bin.patchnotes` = `dist/patchnotes.js`, no runtime `dependencies`, devDependencies `@patch-notes/schema` `workspace:*`, `yaml`, `esbuild`; `tsconfig.json` with `resolveJsonModule`; scripts `typecheck` and `build`) and add root script `build` (`pnpm -r build`); verify `pnpm install && pnpm typecheck` passes
- [x] 1.2 Add `src/bin.ts` and a `run(argv, io)` dispatcher using `parseArgs` in strict mode with `--help`, `--version`, unknown command and unknown option handling; verify tests for every scenario of the help/version and exit-code requirements in `specs/cli-conventions/spec.md`

## 2. Project discovery and output

- [x] 2.1 Implement root discovery (`patchnotes.yaml`, then `.git` file or directory, else cwd) and config loading that stops every command on config errors; verify tests for the three discovery scenarios and the unknown config field scenario
- [x] 2.2 Implement error formatting `<path>: <field>: <message>` with paths relative to the project root on stderr; verify the entry field error scenario

## 3. Check

- [x] 3.1 Implement the directory scan (every `.md` outside `media/`, `/`-separated paths) and `check` combining `parseEntry`, `validateEntrySet`, media `realpath`/regular-file checks and the `try`/`appUrl` rule, returning entries and errors without printing; verify one test per scenario in `specs/entry-check/spec.md`, including the read-only scenario comparing directory contents before and after
- [x] 3.2 Wire `patchnotes check` (entry count on success, errors and exit 1 on failure, missing directory error mentioning `patchnotes new`); verify the command-level scenarios run through `run`

## 4. New

- [x] 4.1 Implement the slug rules from design.md; verify unit tests for the accents and punctuation scenario, `ß`, 80-character cut without trailing `-`, and an empty result
- [x] 4.2 Implement `patchnotes new` (required `--type`, `--id`, repeatable `--request`, `--try`, date from injected `now`, body headings, validation of the rendered text, duplicate id scan, `wx` write, created path on stdout); verify one test per scenario in `specs/entry-scaffolding/spec.md` and that a created entry passes `patchnotes check`

## 5. Release

- [x] 5.1 Implement version resolution (bump keywords from the highest `vX.Y.Z` directory or `0.0.0`, explicit version higher than all existing, usage error otherwise); verify unit tests for patch, minor (including `v1.10.0` over `v1.2.3`), major, first release, existing, lower and invalid argument scenarios
- [x] 5.2 Implement `patchnotes release` (check first, nothing-to-release error, non-recursive `mkdir`, per-file `rename`, rollback in reverse order and directory removal on failure); verify one test per scenario in `specs/release-cut/spec.md`, with the mid-way failure simulated by partially mocking `node:fs/promises` `rename`

## 6. Build and docs

- [x] 6.1 Bundle with esbuild into `dist/patchnotes.js` with a node shebang and the version from `package.json`; verify a test that builds into a temporary directory, copies only the bundle into an empty directory and runs it with `--version` and `check`
- [x] 6.2 Add a CLI section to `README.md` (build, install via `pnpm add -D file:<path>/packages/cli`, the three commands with examples, exit codes) and fix its outdated entry example (`status`, `request`) and config example (`previewUrl`) to match `docs/entry-format.md`; verify each documented `new` command produces an entry that passes `check` in a test or manual run noted in the commit

## 7. Integration

- [x] 7.1 Run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate cli-new-check-release --strict`; verify all pass

## Workflow follow-up

- Archive the change after review with `/opsx:archive`.
