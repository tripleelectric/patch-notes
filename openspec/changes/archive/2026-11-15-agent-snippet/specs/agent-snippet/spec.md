# Spec Delta

## Purpose

Gives coding agents accurate, project-specific instructions for writing patch note entries, so entries are created consistently right when work ships.

## ADDED Requirements

### Requirement: Print instructions
`patchnotes agent-snippet` SHALL print a markdown block delimited by `<!-- patchnotes:start -->` and `<!-- patchnotes:end -->` that tells agents to add an entry for every user-visible change, shows the `patchnotes new` command with all entry types, names the body sections `## What changed`, `## Why` and `## Decisions`, and requires `patchnotes check` to pass.

#### Scenario: Default directory
- **WHEN** the project has no `patchnotes.yaml`
- **THEN** the block mentions `.patchnotes/media/` and the types `feature`, `fix` and `change`

#### Scenario: Configured directory
- **WHEN** `patchnotes.yaml` sets `dir: docs/notes`
- **THEN** the block mentions `docs/notes/media/`

### Requirement: Media and limits in instructions
The block SHALL explain media references with the supported extensions, and SHALL forbid a `status` field, editing entries in released directories, and running `release` or `publish` unless asked.

#### Scenario: Rules present
- **WHEN** the snippet is printed
- **THEN** it lists `.png` and `.webm` and mentions `status`, `release` and `publish`

### Requirement: Write into an instructions file
`patchnotes agent-snippet --write <file>` SHALL replace the existing block between the markers in the file, or append the block separated by a blank line when the file has none, or create the file. Content outside the block SHALL stay byte-for-byte unchanged. The command SHALL print whether the block was created, added or updated.

#### Scenario: Append to existing AGENTS.md
- **WHEN** `AGENTS.md` exists without markers
- **THEN** its previous content is kept and the block follows it

#### Scenario: Update in place
- **WHEN** the command runs twice on the same file
- **THEN** the file contains exactly one block and the second run leaves the file unchanged

#### Scenario: Broken markers
- **WHEN** the file contains a start marker without an end marker
- **THEN** the file is not changed and the command exits with code 1
