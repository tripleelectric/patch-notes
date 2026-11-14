# Tasks

## 1. Shared contract

- [x] 1.1 Add `MEDIA_TYPES` and the publish payload schema to `packages/schema` and export them; verify unit tests for a valid payload, an unsupported content type and a media path missing from the map
- [x] 1.2 Add the media type rule to CLI `check`; verify the SVG and video-as-image scenarios

## 2. Server storage and API

- [x] 2.1 Add `Entry`, `ReviewEvent`, `Media`, `Setting` models and migration, and `PUBLISH_TOKEN` config; verify the short token config test
- [x] 2.2 Implement token auth, `POST /api/media/missing` and streaming `PUT /api/media/:sha256`; verify one test per token-authentication, missing-media and media-upload scenario
- [x] 2.3 Implement `POST /api/publish` with validation, snapshot upsert, removal, restore and status rules in one transaction; verify one test per publish-snapshot, snapshot-semantics and review-status scenario

## 3. CLI

- [x] 3.1 Implement `patchnotes publish`; verify scenarios in `specs/cli-publish/spec.md` against a real server started with `buildApp` on a random port

## 4. Docs and integration

- [x] 4.1 Document `publish`, `PATCHNOTES_TOKEN` and `PUBLISH_TOKEN` in README; run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate publish-api --strict`; verify all pass
