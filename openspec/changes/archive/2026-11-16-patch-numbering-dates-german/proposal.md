# Proposal

## Why

Reviewers refer to entries in meetings ("number 4 in 1.2.0"), need to know when a patch shipped, and the first team using patch-notes works in German. The viewer has no positions, releases carry no date, and every text is English.

## What Changes

- Every entry on a patch page gets a position number (1..n in patch order), shown on its section and in the sidebar.
- Releases get a ship date: `patchnotes release` writes `v<version>/release.yaml` with `date` (today or `--date`); `check` validates it; `publish` sends it; the viewer shows it on the patch header and in the sidebar. Without the file the newest entry date of the release is shown.
- German interface: server environment variable `LANGUAGE` (`en` default, `de`) translates all pages and formats dates.
- `patchnotes.yaml` gets `language` (`en` default, `de`): `patchnotes new` scaffolds headings in that language and `agent-snippet` tells agents to write entries in it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entry-format`: release metadata file `release.yaml`.
- `project-config`: `language` field.
- `release-cut`: writes `release.yaml` with the ship date.
- `entry-check`: validates `release.yaml`.
- `entry-scaffolding`: localized body headings.
- `agent-snippet`: names the content language.
- `publish-api`: receives release dates.
- `cli-publish`: sends release dates.
- `review-viewer`: position numbers, release dates, interface language.
- `server-runtime`: `LANGUAGE` variable.

## Impact

- `packages/schema`: release schema, config field, publish payload `releases`.
- `packages/cli`: release, check, new, publish, agent-snippet.
- `apps/server`: `Release` model and migration, i18n dictionary, views.
- `examples/demo-project`: German content, `release.yaml` files.
