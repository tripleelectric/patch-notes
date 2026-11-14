# publish-api Specification

## Purpose

Receives a project's patch notes from the CLI and stores them as the server's published mirror, without ever overwriting review results that are still valid.

## Requirements

### Requirement: Token authentication
All `/api/` publish endpoints SHALL require `Authorization: Bearer <token>` equal to `PUBLISH_TOKEN`, compared in constant time. A missing or wrong token SHALL return `401`. When `PUBLISH_TOKEN` is not configured, the endpoints SHALL return `503`.

#### Scenario: Wrong token
- **WHEN** a request to `/api/publish` carries a wrong bearer token
- **THEN** the response is `401` and nothing is stored

#### Scenario: Publishing disabled
- **WHEN** the server runs without `PUBLISH_TOKEN`
- **THEN** `/api/publish` returns `503`

### Requirement: Missing media query
`POST /api/media/missing` with `{"hashes": [...]}` of lowercase SHA-256 hex strings SHALL return `{"missing": [...]}` listing the hashes the server has no file for, in request order.

#### Scenario: One known, one unknown
- **WHEN** the server stores media `aaa…` and the request lists `aaa…` and `bbb…`
- **THEN** the response is `{"missing": ["bbb…"]}`

### Requirement: Media upload
`PUT /api/media/<sha256>` SHALL store the request body as a media file when its SHA-256 equals the path hash, its `Content-Type` is a supported media type (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`) and it is at most 200 MB. A hash mismatch SHALL return `400`, an unsupported type `415` and an oversized body `413`; in each case nothing is stored. Uploading an existing hash SHALL succeed without change.

#### Scenario: Valid upload
- **WHEN** a PNG is uploaded under its SHA-256
- **THEN** the response is `201` and the hash is no longer reported missing

#### Scenario: Hash mismatch
- **WHEN** the body's SHA-256 differs from the path
- **THEN** the response is `400` and the hash is still reported missing

#### Scenario: SVG rejected
- **WHEN** the content type is `image/svg+xml`
- **THEN** the response is `415`

### Requirement: Publish snapshot
`POST /api/publish` SHALL accept the full set of entries of a project, each with its frontmatter fields, release version (or none), body and media references by hash, plus an optional `appUrl`. Every entry SHALL be validated with the entry format rules; every referenced hash SHALL exist on the server. On any error nothing SHALL change and the response SHALL be `400` listing the errors.

#### Scenario: Missing media hash
- **WHEN** an entry references a hash the server does not have
- **THEN** the response is `400` naming the entry and the hash, and no entry changes

#### Scenario: Invalid entry
- **WHEN** an entry has `type: bugfix`
- **THEN** the response is `400` naming the entry id and field `type`

### Requirement: Snapshot semantics
A successful publish SHALL create entries with new ids, update entries whose content or release changed, keep unchanged entries untouched, and mark entries absent from the snapshot as removed; an entry that reappears SHALL be restored. The response SHALL report the counts `created`, `updated`, `unchanged`, `removed`. Publishing the same snapshot twice SHALL report everything unchanged the second time.

#### Scenario: Idempotent
- **WHEN** the same snapshot is published twice
- **THEN** the second response reports all entries as unchanged and zero removed

#### Scenario: Entry deleted in repo
- **WHEN** a published entry is missing from the next snapshot
- **THEN** it is marked removed and counted in `removed`

### Requirement: Review status survives publishing
New entries SHALL start as `awaiting-review`. Publishing SHALL NOT change an entry's review status unless its content (frontmatter fields other than the release, body or media) changed; then the status SHALL return to `awaiting-review` and an `updated` event SHALL be recorded in the entry's review history. Moving an entry to a release SHALL NOT change its status.

#### Scenario: Accepted entry released
- **WHEN** an accepted entry moves from unreleased to `1.4.0` without other changes
- **THEN** it stays `accepted`

#### Scenario: Accepted entry edited
- **WHEN** an accepted entry's body changes
- **THEN** its status becomes `awaiting-review` and its history shows an `updated` event
