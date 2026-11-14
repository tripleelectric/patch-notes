# Proposal

## Why

Most entries will be written by coding agents right after they ship a change. Agents only follow the format reliably when the project's agent instructions (AGENTS.md, CLAUDE.md) tell them when and how to write an entry. Hand-written instructions drift from the real format; the CLI can generate them.

## What Changes

- `patchnotes agent-snippet` prints a markdown block with instructions for coding agents: when to add an entry, the `new` and `check` commands, body sections, media rules and what not to do.
- `patchnotes agent-snippet --write <file>` inserts the block into an instructions file, or replaces the block written earlier, between fixed markers; the rest of the file stays unchanged.
- The block uses the project's configured patch notes directory and the format's current types and media extensions.

## Capabilities

### New Capabilities

- `agent-snippet`: generating and installing agent instructions for writing patch notes.

### Modified Capabilities

- `cli-conventions`: help lists the new command.

## Impact

- `packages/cli`: new command; README section.
