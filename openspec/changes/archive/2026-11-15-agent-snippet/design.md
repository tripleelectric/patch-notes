# Design

## Context

CLI with `run(argv, io)`, project discovery and config. See proposal.md and specs/.

## Decisions

### Generated from code, not a static file
The block is built from `entrySchema`'s type options, `MEDIA_TYPES` and the configured `dir`, so it cannot drift from the format the CLI validates.

### Markers instead of a separate file
Agents read AGENTS.md / CLAUDE.md, not arbitrary files. HTML comment markers are invisible when rendered and let `--write` update the block idempotently. Paths are resolved relative to the working directory, like other CLI file arguments. A start marker without an end marker is an error rather than a guess, so user content is never overwritten.

## Risks / Trade-offs

- [Agents ignore instructions] → The block is short, imperative and puts the two commands first; `patchnotes check` in CI catches mistakes.
