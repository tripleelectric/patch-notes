# Tasks

## 1. Workspace setup

- [ ] 1.1 Add root `package.json` (private, ESM, `packageManager` pnpm, engines node >=22, scripts `test` and `typecheck`), `pnpm-workspace.yaml` (`packages/*`, `apps/*`), `tsconfig.base.json` (strict, NodeNext) and `.gitignore`; verify `pnpm install` succeeds
- [ ] 1.2 Add root `vitest.config.ts` with per-package projects; verify `pnpm test` runs and reports no test files without failing
- [ ] 1.3 Create `packages/schema` (`package.json` with `exports` pointing to `src/index.ts`, `tsconfig.json`, deps `zod` and `yaml`); verify `pnpm typecheck` passes

## 2. Shared parsing primitives

- [ ] 2.1 Implement the result and error types (`file`, `field?`, `message`) and a zod-issue-to-error mapper that reports all issues and names unknown keys; verify with unit tests for a multi-issue object
- [ ] 2.2 Implement frontmatter split (leading `---` block, body rest) using the `yaml` package; verify tests for missing frontmatter, malformed YAML with message, empty body

## 3. Entry format

- [ ] 3.1 Implement the strict entry schema: `id`, `title`, `type`, `date` (real calendar date), `requests`, `try`, `media` union with path rules; verify one test per scenario in `specs/entry-format/spec.md` for fields, media and unknown fields including `status`
- [ ] 3.2 Implement `parseEntry(content, relPath)`: frontmatter, schema, id equals file name, release from directory (`unreleased` or `vX.Y.Z`); verify tests for id mismatch, released, unreleased and unknown directory scenarios
- [ ] 3.3 Implement `validateEntrySet(entries)` for unique ids across releases; verify the duplicate-id test names both paths

## 4. Project config

- [ ] 4.1 Implement the strict config schema and `parseConfig(content)` with `dir` default, URL checks, `dir` escape check and dedicated `token` error; verify one test per scenario in `specs/project-config/spec.md`

## 5. Docs and integration

- [ ] 5.1 Export the public API from `packages/schema/src/index.ts` and add `docs/entry-format.md` with a complete example entry and config; verify the documented example parses in a test that reads the doc's code blocks
- [ ] 5.2 Run `pnpm typecheck && pnpm test` and `openspec validate entry-schema-and-config --strict`; verify all pass
