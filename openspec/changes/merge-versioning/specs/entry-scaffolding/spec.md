# Spec Delta

## MODIFIED Requirements

### Requirement: Create an entry
`patchnotes new <title> --type <feature|fix|change>` SHALL create `<dir>/<id>.md` with frontmatter `id`, `title`, `type` and `date` set to today's local date, followed by a body with three headings in the configured language: `## What changed`, `## Why`, `## Decisions` for `en`, and `## Was hat sich geändert`, `## Warum`, `## Entscheidungen` for `de`. It SHALL print the created path, relative to the project root, to stdout.

#### Scenario: New feature entry
- **WHEN** the user runs `patchnotes new "Invoice export as CSV" --type feature` on 2026-11-14
- **THEN** `.patchnotes/invoice-export-as-csv.md` exists with `id: invoice-export-as-csv`, `title: Invoice export as CSV`, `type: feature`, `date: 2026-11-14` and stdout is `.patchnotes/invoice-export-as-csv.md`

#### Scenario: Missing directories
- **WHEN** the patch notes directory does not exist
- **THEN** the command creates it and the entry

#### Scenario: German headings
- **WHEN** `patchnotes.yaml` sets `language: de`
- **THEN** the new entry's body has the headings `## Was hat sich geändert`, `## Warum` and `## Entscheidungen`

### Requirement: No overwrite or duplicate id
The command SHALL fail with exit code 1 and write nothing if an entry with the same id exists in the patch notes directory.

#### Scenario: Id already released
- **WHEN** `.patchnotes/invoice-export.md` exists and the user runs `patchnotes new "Invoice export" --type fix`
- **THEN** no file is written and the error names `.patchnotes/invoice-export.md`
