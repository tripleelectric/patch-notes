# entry-check Specification

## Purpose

Validates a project's whole patch notes directory in one run, so authors, agents and CI find every broken entry, duplicate id or missing media file before release or publish.

## Requirements

### Requirement: Check all entries
`patchnotes check` SHALL treat every `.md` file in the patch notes directory, at any depth except inside `media/`, as an entry, validate each one against the entry format and report the errors of all files in one run.

#### Scenario: All entries valid
- **WHEN** every entry is valid
- **THEN** stdout reports the number of checked entries and the exit code is 0

#### Scenario: Errors in two files
- **WHEN** `unreleased/a.md` has an invalid `type` and `v1.0.0/b.md` has no `title`
- **THEN** both errors are printed and the exit code is 1

#### Scenario: Entry in an unknown directory
- **WHEN** `next/a.md` exists
- **THEN** an error names the directory `next` and the exit code is 1

#### Scenario: Non-entry files
- **WHEN** `unreleased/.gitkeep` exists
- **THEN** the file is ignored

### Requirement: Unique ids checked
The check SHALL report duplicate ids across all releases, naming both files.

#### Scenario: Duplicate id
- **WHEN** `unreleased/a.md` and `v1.0.0/a.md` both exist and are valid
- **THEN** an error names both paths and the exit code is 1

### Requirement: Media files exist
Every media path referenced by a valid entry SHALL resolve to an existing regular file inside the patch notes directory, also after following symbolic links.

#### Scenario: Missing media file
- **WHEN** an entry references `media/a.png` and the file does not exist
- **THEN** an error names the entry file, the field `media.0.image` and the missing path, and the exit code is 1

#### Scenario: Symbolic link leaving the directory
- **WHEN** `media/a.png` is a symbolic link to a file outside the patch notes directory
- **THEN** an error states the path must stay inside the patch notes directory and the exit code is 1

#### Scenario: Directory instead of file
- **WHEN** an entry references `media` itself
- **THEN** an error states the path is not a file and the exit code is 1

### Requirement: Try paths need an app URL
An entry whose `try` is a path SHALL be an error when the config has no `appUrl`, because the link cannot be resolved.

#### Scenario: Path try without appUrl
- **WHEN** an entry has `try: /invoices` and `patchnotes.yaml` has no `appUrl`
- **THEN** an error names the field `try` and mentions `appUrl`, and the exit code is 1

#### Scenario: Absolute try without appUrl
- **WHEN** an entry has `try: https://app.example.com/invoices` and no `appUrl` is configured
- **THEN** no error is reported for `try`

### Requirement: Missing patch notes directory
When the configured patch notes directory does not exist, the check SHALL fail with exit code 1 and an error naming the directory and suggesting `patchnotes new`.

#### Scenario: Directory missing
- **WHEN** `.patchnotes` does not exist
- **THEN** the error names `.patchnotes`, mentions `patchnotes new` and the exit code is 1

### Requirement: Read-only
The check SHALL NOT create, change or delete any file.

#### Scenario: Check on an invalid directory
- **WHEN** the check runs and finds errors
- **THEN** the patch notes directory is byte-for-byte unchanged

### Requirement: Supported media types
Every media path SHALL end in a supported extension: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` for images (also as `before`/`after`) and `.mp4`, `.webm` for videos. Video files SHALL only be referenced as `video`, images only as `image`, `before` or `after`.

#### Scenario: SVG image
- **WHEN** an entry references `image: media/logo.svg`
- **THEN** an error names the field `media.0.image` and lists the supported extensions, and the exit code is 1

#### Scenario: Video as image
- **WHEN** an entry references `image: media/flow.webm`
- **THEN** an error names the field `media.0.image` and the exit code is 1
