# Spec Delta

## Purpose

Lets authors and agents create a new, valid patch note entry with one non-interactive command, so nobody writes frontmatter by hand or guesses the format.

## ADDED Requirements

### Requirement: Create an entry
`patchnotes new <title> --type <feature|fix|change>` SHALL create `<dir>/unreleased/<id>.md` with frontmatter `id`, `title`, `type` and `date` set to today's local date, followed by a body with the headings `## What changed`, `## Why` and `## Decisions`. It SHALL print the created path, relative to the project root, to stdout.

#### Scenario: New feature entry
- **WHEN** the user runs `patchnotes new "Invoice export as CSV" --type feature` on 2026-11-14
- **THEN** `.patchnotes/unreleased/invoice-export-as-csv.md` exists with `id: invoice-export-as-csv`, `title: Invoice export as CSV`, `type: feature`, `date: 2026-11-14` and stdout is `.patchnotes/unreleased/invoice-export-as-csv.md`

#### Scenario: Missing directories
- **WHEN** the patch notes directory or its `unreleased/` directory does not exist
- **THEN** the command creates them and the entry

### Requirement: Type is required
The command SHALL NOT pick a default type. A missing or invalid `--type` SHALL be a usage error.

#### Scenario: Missing type
- **WHEN** the user runs `patchnotes new "Invoice export"`
- **THEN** no file is written and the exit code is 2

#### Scenario: Invalid type
- **WHEN** the user runs `patchnotes new "Invoice export" --type bugfix`
- **THEN** no file is written, the error lists the allowed types and the exit code is 2

### Requirement: Id derived from title
Without `--id`, the id SHALL be derived from the title: letters reduced to ASCII without accents, lowercased, every run of other characters replaced by one `-`, leading and trailing `-` removed, cut to at most 80 characters without a trailing `-`. `--id <id>` SHALL override the derived id.

#### Scenario: Accents and punctuation
- **WHEN** the title is `Übersicht: Rechnungen & Gutschriften!`
- **THEN** the id is `ubersicht-rechnungen-gutschriften`

#### Scenario: Explicit id
- **WHEN** the user passes `--id csv-export`
- **THEN** the file is `unreleased/csv-export.md` with `id: csv-export`

#### Scenario: Title without usable characters
- **WHEN** the title is `!!!` and no `--id` is given
- **THEN** no file is written, the error asks for `--id` and the exit code is 1

### Requirement: Optional fields from flags
`--request <url>` SHALL add a request link and SHALL be repeatable, keeping order. `--try <link>` SHALL set the try link.

#### Scenario: Two requests and a try link
- **WHEN** the user passes `--request https://a.example.com/1 --request https://b.example.com/2 --try /invoices`
- **THEN** the entry has both request links in that order and `try: /invoices`

### Requirement: Created entries are valid
The command SHALL validate the entry it is about to write against the entry format and SHALL write nothing if validation fails, printing the errors and exiting with code 1.

#### Scenario: Invalid request link
- **WHEN** the user passes `--request ASANA-123`
- **THEN** no file is written, an error names the field `requests` and the exit code is 1

#### Scenario: Title too long
- **WHEN** the title has 121 characters
- **THEN** no file is written, an error names the field `title` and the exit code is 1

### Requirement: No overwrite or duplicate id
The command SHALL fail with exit code 1 and write nothing if an entry with the same id exists in any release of the patch notes directory.

#### Scenario: Id already released
- **WHEN** `.patchnotes/v1.0.0/invoice-export.md` exists and the user runs `patchnotes new "Invoice export" --type fix`
- **THEN** no file is written and the error names `.patchnotes/v1.0.0/invoice-export.md`
