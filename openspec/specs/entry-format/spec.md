# entry-format Specification

## Purpose

Defines what a patch note entry is, which fields it carries and how entries are laid out in the `.patchnotes/` directory, so every tool and agent produces and reads the same format.

## Requirements

### Requirement: Entry file structure
An entry SHALL be a UTF-8 markdown file with a YAML frontmatter block delimited by `---` lines at the start of the file. The markdown after the frontmatter is the entry body and MAY be empty.

#### Scenario: Valid entry with body
- **WHEN** a file starts with a frontmatter block holding all required fields, followed by markdown
- **THEN** parsing returns the typed fields and the body as a string

#### Scenario: Missing frontmatter
- **WHEN** a file does not start with a `---` frontmatter block
- **THEN** parsing fails with an error stating that frontmatter is missing

#### Scenario: Malformed YAML
- **WHEN** the frontmatter is not valid YAML
- **THEN** parsing fails with an error that includes the YAML error message

### Requirement: Required entry fields
An entry SHALL have `id` (kebab-case, 1 to 80 characters), `title` (1 to 120 characters), `type` (one of `feature`, `fix`, `change`) and `date` (calendar date in `YYYY-MM-DD` format).

#### Scenario: Missing required field
- **WHEN** the frontmatter has no `title`
- **THEN** parsing fails with an error naming the field `title`

#### Scenario: Invalid type
- **WHEN** `type` is `bugfix`
- **THEN** parsing fails with an error naming the field `type` and listing the allowed values

#### Scenario: Invalid date
- **WHEN** `date` is `2026-13-01`
- **THEN** parsing fails with an error naming the field `date`

#### Scenario: Invalid id
- **WHEN** `id` is `Invoice Export`
- **THEN** parsing fails with an error naming the field `id`

### Requirement: Entry id matches file name
The `id` field SHALL equal the file name without the `.md` extension.

#### Scenario: Mismatch
- **WHEN** file `invoice-export.md` has `id: csv-export`
- **THEN** parsing fails with an error stating the id and the file name differ

### Requirement: Request links
`requests` is optional. When present, it SHALL be a list of absolute `http` or `https` URLs pointing to the originating requests in any tracker.

#### Scenario: Valid request links
- **WHEN** `requests` holds two https URLs
- **THEN** parsing returns both URLs in order

#### Scenario: Non-URL request
- **WHEN** `requests` holds `ASANA-123`
- **THEN** parsing fails with an error naming the field `requests`

### Requirement: Try link
`try` is optional. When present, it SHALL be either an absolute `http`/`https` URL, or a path starting with `/` that is resolved against the configured `appUrl`.

#### Scenario: Path try link
- **WHEN** `try` is `/invoices?export=1`
- **THEN** parsing accepts it as a path

#### Scenario: Relative try link
- **WHEN** `try` is `invoices`
- **THEN** parsing fails with an error naming the field `try`

### Requirement: Media references
An entry MAY have `media`, a list where each item is exactly one of: an `image` path, a `video` path, or a `before` and `after` path pair. Each item MAY have a `caption`. Paths SHALL be relative to the `.patchnotes/` directory and SHALL NOT be absolute, contain `..` segments or contain backslashes.

#### Scenario: Before/after pair
- **WHEN** a media item has `before: media/a.png` and `after: media/b.png`
- **THEN** parsing returns a before/after media item

#### Scenario: Incomplete pair
- **WHEN** a media item has `before` but no `after`
- **THEN** parsing fails with an error naming the media item index

#### Scenario: Path escape
- **WHEN** a media path is `../secrets.png` or `/etc/passwd`
- **THEN** parsing fails with an error stating the path must stay inside the patch notes directory

### Requirement: Unknown fields rejected
Frontmatter fields not defined by this spec SHALL be rejected, so typos surface instead of being silently ignored.

#### Scenario: Typo in field name
- **WHEN** the frontmatter has `tittle` instead of `title`
- **THEN** parsing fails with an error naming `tittle` as unknown

### Requirement: Review status not stored in entries
Entries SHALL NOT carry review status. A `status` field is rejected like any unknown field.

#### Scenario: Status field present
- **WHEN** the frontmatter has `status: accepted`
- **THEN** parsing fails with an error naming `status` as unknown

### Requirement: Directory layout
The patch notes directory SHALL contain `unreleased/` for entries not yet released, one directory per release named `v<MAJOR>.<MINOR>.<PATCH>`, and `media/` for media files. Each entry file's location determines its release.

#### Scenario: Unreleased entry
- **WHEN** an entry lives at `unreleased/invoice-export.md`
- **THEN** its release is resolved as unreleased

#### Scenario: Released entry
- **WHEN** an entry lives at `v1.4.0/invoice-export.md`
- **THEN** its release is resolved as version `1.4.0`

#### Scenario: Unknown directory
- **WHEN** an entry lives at `next/invoice-export.md`
- **THEN** resolving its release fails with an error naming the directory

### Requirement: Unique entry ids
Entry ids SHALL be unique across all releases in one patch notes directory.

#### Scenario: Duplicate id
- **WHEN** `unreleased/invoice-export.md` and `v1.4.0/invoice-export.md` both exist
- **THEN** validation of the entry set fails with an error naming both paths

### Requirement: Readable errors
Every validation error SHALL include the file path and, when applicable, the field path. All errors of one file SHALL be reported together, not only the first.

#### Scenario: Multiple errors
- **WHEN** a file is missing `title` and has an invalid `type`
- **THEN** parsing reports both errors, each with the file path and field name

### Requirement: Release metadata
A version directory MAY contain `release.yaml` with exactly one field, `date`, a calendar date in `YYYY-MM-DD` format, stating when the release shipped. Unknown fields SHALL be rejected. `release.yaml` SHALL NOT appear in `unreleased/`.

#### Scenario: Valid release file
- **WHEN** `v1.4.0/release.yaml` contains `date: 2026-11-14`
- **THEN** parsing returns the date `2026-11-14`

#### Scenario: Invalid date
- **WHEN** `release.yaml` contains `date: 2026-02-30`
- **THEN** parsing fails with an error naming the field `date`
