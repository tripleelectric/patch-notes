# Spec Delta

## Purpose

Defines behavior shared by every `patchnotes` command: how the project and its config are found, how errors are reported and which exit codes callers such as CI and agents can rely on.

## ADDED Requirements

### Requirement: Project root discovery
The CLI SHALL use as project root the nearest directory, starting at the working directory and walking up, that contains `patchnotes.yaml`. If none is found, it SHALL use the nearest directory containing `.git`, and otherwise the working directory.

#### Scenario: Config in a parent directory
- **WHEN** the CLI runs in `app/src` and `app/patchnotes.yaml` exists
- **THEN** `app` is the project root and its config is used

#### Scenario: No config, inside a git repository
- **WHEN** the CLI runs in `repo/packages/web`, `repo/.git` exists and no `patchnotes.yaml` exists on the way up
- **THEN** `repo` is the project root and the config defaults apply

#### Scenario: No config, no git repository
- **WHEN** no `patchnotes.yaml` and no `.git` exist on the way up
- **THEN** the working directory is the project root and the config defaults apply

### Requirement: Invalid config stops every command
When `patchnotes.yaml` exists but fails validation, every command SHALL print all config errors and exit with code 1 without reading or writing entries.

#### Scenario: Unknown config field
- **WHEN** `patchnotes.yaml` has `sever: https://x.example.com` and the user runs any command
- **THEN** the CLI prints an error naming `sever` and exits with code 1

### Requirement: Error output format
Validation errors SHALL be printed to stderr, one per line, as `<path>: <field>: <message>`, or `<path>: <message>` when no field applies. Paths SHALL be relative to the project root.

#### Scenario: Entry field error
- **WHEN** entry `.patchnotes/unreleased/a.md` has an invalid `type`
- **THEN** stderr contains a line starting with `.patchnotes/unreleased/a.md: type: `

### Requirement: Exit codes
The CLI SHALL exit with code 0 on success, 1 when validation or the requested operation fails, and 2 on invalid usage such as an unknown command, unknown option or missing argument.

#### Scenario: Unknown command
- **WHEN** the user runs `patchnotes frobnicate`
- **THEN** the CLI prints usage to stderr and exits with code 2

#### Scenario: Unknown option
- **WHEN** the user runs `patchnotes check --fast`
- **THEN** the CLI prints an error naming `--fast` and exits with code 2

### Requirement: Help and version
`patchnotes --help` SHALL print usage listing all commands to stdout and exit with code 0. `patchnotes --version` SHALL print the CLI version and exit with code 0. `patchnotes` without arguments SHALL print usage to stderr and exit with code 2.

#### Scenario: Help
- **WHEN** the user runs `patchnotes --help`
- **THEN** stdout lists the commands `new`, `check` and `release` and the exit code is 0

#### Scenario: No arguments
- **WHEN** the user runs `patchnotes`
- **THEN** usage is printed to stderr and the exit code is 2

### Requirement: Self-contained executable
The CLI SHALL be buildable into a single executable file that runs on Node 22 or newer without installing further packages.

#### Scenario: Built executable runs
- **WHEN** the built file is copied alone into an empty directory and run with `--version`
- **THEN** it prints the version and exits with code 0
