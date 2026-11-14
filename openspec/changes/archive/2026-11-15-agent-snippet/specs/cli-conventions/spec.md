# Spec Delta

## MODIFIED Requirements

### Requirement: Help and version
`patchnotes --help` SHALL print usage listing all commands to stdout and exit with code 0. `patchnotes --version` SHALL print the CLI version and exit with code 0. `patchnotes` without arguments SHALL print usage to stderr and exit with code 2.

#### Scenario: Help
- **WHEN** the user runs `patchnotes --help`
- **THEN** stdout lists the commands `new`, `check`, `release`, `publish` and `agent-snippet` and the exit code is 0

#### Scenario: No arguments
- **WHEN** the user runs `patchnotes`
- **THEN** usage is printed to stderr and the exit code is 2
