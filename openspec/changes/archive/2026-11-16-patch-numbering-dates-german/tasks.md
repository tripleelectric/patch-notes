# Tasks

## 1. Schema and CLI

- [x] 1.1 Add the release schema (`parseRelease`), config `language` and payload `releases` in `packages/schema`; verify unit tests for valid and invalid release files and the unsupported-language config scenario
- [x] 1.2 Write `release.yaml` in `patchnotes release` with `--date`, validate release files in `check`, localize `new` headings and the agent snippet, send release dates in `publish`; verify one test per scenario in the release-cut, entry-check, entry-scaffolding, agent-snippet and cli-publish deltas

## 2. Server

- [x] 2.1 Add `Release` model and migration, store dates on publish and `LANGUAGE` config; verify the publish-api and server-runtime scenarios
- [x] 2.2 Add the i18n dictionary with request-scoped language, translate all views and format dates; verify the German interface scenario and that English stays the default
- [x] 2.3 Show position numbers and release dates; verify the position number and release date scenarios

## 3. Demo and integration

- [x] 3.1 Run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate patch-numbering-dates-german --strict`; verify all pass

## Workflow follow-up

- The German demo moved to the `reading-first-review` change, which changes the review model the demo seeds.
