# Tasks

## 1. Schema: flat layout, branch config, required version

- [ ] 1.1 `packages/schema/src/entry.ts`: entries resolve only as `<id>.md` directly in the dir; any subdirectory is an error naming it; drop `Entry.version`. Update `entry.test.ts` for flat, `unreleased/` and `v1.4.0/` paths, and verify `pnpm vitest run packages/schema` passes
- [ ] 1.2 Remove `release.ts` (`parseRelease`, `RELEASE_FILE`, keep `calendarDate` where it is used) and `release.test.ts`; verify typecheck passes
- [ ] 1.3 `config.ts`: add `branch` (default `main`, valid git branch name without spaces). Cover the empty, `master` and invalid cases in `config.test.ts`
- [ ] 1.4 `publish.ts`: `version` is required (non-null). Add a test that a `null` version is rejected

## 2. CLI: history, check, new, publish, help

- [ ] 2.1 New `packages/cli/src/history.ts`: derive releases from the git history (design: first-parent, `--no-renames`, first id wins, type from blob via `cat-file --batch`, `%cs` date, feature bumps minor, else patch, from `0.0.0`). Return id to version plus version to date. Test with temp git repos for: merge commit with two entries, code-only merge, direct commit, branch commits not counted, edited entry, moved legacy entry, deleted entry not renumbering, type changed later, unparseable blob counts as patch
- [ ] 2.2 Add publish guards in history or publish: not a git repo, shallow clone, missing branch, `HEAD` not at branch tip, dirty or untracked files in `<dir>`. Each one gets a test asserting exit code 1 and the error text
- [ ] 2.3 `check.ts`: drop release file scanning, add one legacy-layout error (`unreleased/`, `vX.Y.Z/`, `release.yaml`) pointing to the README migration; check needs no git. Update `check.test.ts`
- [ ] 2.4 `commands/new.ts`: write `<dir>/<id>.md`, duplicate check over the flat dir. Update `new.test.ts`
- [ ] 2.5 `commands/publish.ts`: run guards, attach versions and releases from history, print the release count. Update the server's `cli-publish.test.ts` to publish from a temp git repo and verify that two merges since the last publish arrive as two releases
- [ ] 2.6 Delete `commands/release.ts`, `release.test.ts`, the bump logic in `version.ts`/`version.test.ts` that only `release` uses, and the `release` usage in `run.ts`; verify `run.test.ts` help output lists no `release`
- [ ] 2.7 `commands/agent-snippet.ts`: replace the released-directory and `release` rules with "commit the entry on your branch with the change; it becomes a release when merged". Update `agent-snippet.test.ts` (no `release` or `unreleased` in output)

## 3. Server: no unreleased

- [ ] 3.1 `routes/publish.ts`: rely on the required version and drop the null handling. Verify `publish.test.ts` still covers "version change keeps change request" with `0.3.1` to `0.7.0`
- [ ] 3.2 `review.ts`, `routes/viewer.tsx`, `views/timeline.tsx`, `i18n.ts`: drop the unreleased slug, label, "not yet released" and the `/releases/unreleased` route (it returns 404); list only entries with a version. Update `viewer.test.ts` and `i18n.test.ts`, and verify `pnpm test` passes

## 4. Docs, demo, distribution

- [ ] 4.1 README and `docs/entry-format.md`: new layout, `branch`, "every merge is a release" model, removed `release` command, migration one-liner, GitHub Actions template from the design, Actions cost note. Verify `docs.test.ts` passes
- [ ] 4.2 Demo: migrate `examples/demo-project` to the flat layout. Make `scripts/demo.sh`/`seed-demo.mjs` build a throwaway git repo with a few merge commits from it before publishing. Verify `pnpm demo` shows several versions and no Unreleased
- [ ] 4.3 Add `scripts/release-cli.sh` (build, `gh release create cli-v<version>` with `packages/cli/dist/patchnotes.js`), bump the CLI to `0.2.0`, and document it in the README. Verify with `bash -n` and a dry read; the actual release runs after merge
- [ ] 4.4 Integration: `pnpm build && pnpm test && pnpm typecheck` green; `openspec validate merge-versioning --strict` passes

## Workflow follow-up

- Deploy the new server image, then run `scripts/release-cli.sh`.
- Wire next-influenceme (separate repo): migration commit, `branch: master`, `.github/workflows/patchnotes.yml`, `PATCHNOTES_TOKEN` secret, refreshed agent snippet.
- Archive the change after merge.
