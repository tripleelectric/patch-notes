# Design

## Context

Today the file location (`unreleased/`, `vX.Y.Z/`) is the source of an entry's release, and `release.yaml` holds the ship date. Both are written by `patchnotes release`, which nobody runs after each merge. The first consumer merges GitHub PRs as merge commits into `master` and sometimes pushes small fixes directly; its first-parent history is clean. The CLI is a single esbuild bundle (`dist/patchnotes.js`, no runtime dependencies) but is not published anywhere, so CI cannot install it today.

## Goals / Non-Goals

**Goals:**
- Release = merge, fully derived, zero manual steps and zero generated commits.
- Any publish fixes the whole server state, so a missed or failed run does no lasting harm.
- Nothing project- or vendor-specific in this repo; CI is a documented template.

**Non-Goals:**
- Major versions (no `breaking` flag); add it when someone needs it.
- Squash-merge or rebase-merge specific handling: they also produce one first-parent commit per PR, so they work without special code.
- A `migrate` command: the migration is one shell line in the README.
- Publishing to npm.

## Decisions

### Versions come from first appearance of an entry id in first-parent history
One git call: `git log <branch> --first-parent --reverse --no-renames --diff-filter=A --name-only --format=<marker>%H %cs -- <dir>`. Walk commits in order, take entry paths directly in `<dir>` or legacy subdirectories, map basename to id, keep only ids not seen before. A commit with at least one new id is a release.
- Keying by id instead of path makes the legacy migration (a pure move) add no new release and keeps old entries at the merge that first shipped them.
- `--no-renames` makes moves show as adds, which the "first id wins" rule then ignores.
- Including ids of entries deleted later keeps numbers stable.
- Alternative: `git log --follow` per file. Rejected: one process per entry and rename detection heuristics.
- Alternative: write the version into the entry at merge time. Rejected: needs a bot commit, which is what the user wants to avoid.

### Bump type from the entry blob at the release commit
Read added entries at their release commit in one `git cat-file --batch` call and parse `type` from the frontmatter. Later edits to `type` do not renumber history. An unparseable blob counts as patch. Alternative: use the current file's type. Rejected: editing an old entry would renumber every later release.

### Ship date is the committer date (`%cs`)
For a GitHub merge, the committer date is the merge time. The author date would be the branch's first commit.

### Publish guards instead of a git-ref reader
Publish requires `HEAD` = `<branch>` tip, a clean `<dir>` (`git status --porcelain -- <dir>`) and a non-shallow repo. Then the working tree equals the branch, and every entry has a version.
- Alternative: read entries and media from the branch via git objects regardless of checkout. Rejected: duplicates the file reading path for little gain, because CI always runs on the tip.
- This also fixes an existing hazard: publishing from a feature branch would mark master-only entries as removed.

### Config `branch` with default `main`
Explicit config beats auto-detecting `origin/HEAD`, which `actions/checkout` does not set and which local clones often lack. Projects on `master` set one line.

### Server: version required, no unreleased UI
The payload schema makes `version` non-null. Viewer, routes and i18n drop the unreleased code path. The DB column stays nullable: no migration, legacy rows are overwritten by the first new publish, and removed legacy rows are never listed. `compareReleases` and `releaseSlug` become string-only.

### CLI distribution via GitHub release asset
A `scripts/release-cli.sh` in this repo builds the bundle and runs `gh release create cli-v<version> packages/cli/dist/patchnotes.js`. Consumers download a pinned version in CI with `curl` and run it with `node`.
- Alternative: npm. Rejected for now: needs a package name and an npm account, and a public GitHub repo already gives stable, versioned URLs.

### Workflow template (README)
```yaml
on: { push: { branches: [master] } }
concurrency: { group: patchnotes, cancel-in-progress: false }
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: curl -fsSL https://github.com/tripleelectric/patch-notes/releases/download/cli-v0.2.0/patchnotes.js -o "$RUNNER_TEMP/patchnotes.js"
      - run: node "$RUNNER_TEMP/patchnotes.js" publish
        env: { PATCHNOTES_TOKEN: "${{ secrets.PATCHNOTES_TOKEN }}" }
```
`concurrency` serializes runs. Because publish is a full snapshot, the last run wins with complete state.

## Risks / Trade-offs

- [Existing hand-cut versions (e.g. `0.1.0` to `0.3.1`) are replaced by derived numbers] → Review status is keyed by entry id and survives. A version change does not reopen entries. Mention it to reviewers once.
- [A rewritten or force-pushed branch history renumbers releases] → Protected main branches make this rare. The next publish is consistent again.
- [A backfill PR that adds many old entries at once becomes one release] → Accepted. It is what was merged.
- [The server must be reachable from GitHub-hosted runners] → Documented. Otherwise use a self-hosted runner or publish locally from the branch tip.
- [Private repos use Actions minutes] → A run takes about 30 s, which fits well inside the free tier.
- [Publish from a dev machine on an outdated local `master`] → Allowed, and it publishes an older consistent state. The next CI run corrects it.

## Migration Plan

1. Ship this repo: schema, CLI, server. Deploy the server image before the consumers run the new CLI, because the old CLI sends `null` versions that the new server rejects.
2. In each consumer, one commit: `git mv .patchnotes/{unreleased,v*}/*.md .patchnotes/ && git rm -q .patchnotes/v*/release.yaml .patchnotes/unreleased/.gitkeep`. Add `branch: master` when needed. Add the workflow and the `PATCHNOTES_TOKEN` secret. Refresh the agent snippet with `patchnotes agent-snippet --write AGENTS.md`.
3. Rollback: redeploy the previous server image. The old CLI cannot read the flat layout, so roll back the consumer commit too.
