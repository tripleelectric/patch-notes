# Design

## Context

See proposal.md. Viewer renders one page per release (`patch-page`); publish sends entry snapshots; CLI `release` moves files.

## Decisions

### Ship date in `release.yaml`, not git
The repo is the source of truth and the tool does not touch git, so the date lives next to the entries. A separate file keeps entry files unchanged on release. The fallback (newest entry date) keeps older releases without the file useful.

### Interface language per instance, content language per project
One deployment serves one team, so `LANGUAGE` is an environment variable like the rest of the server config. Content language belongs to the repo (`patchnotes.yaml`), where `new` and `agent-snippet` use it. The two are independent: a German team can still write English entries.

### Translation without prop threading
`i18n.ts` holds typed `en` and `de` dictionaries (German must define every English key, checked by the type). The active language is kept in `AsyncLocalStorage`, set per request in an `onRequest` hook from the app config; `t(key, params?)` and the date formatters read it. Views stay plain functions without a `t` prop. Outside a request (tests rendering directly) English is used.

### Dates
Dates render through `Intl.DateTimeFormat` (`de-DE`: `14.11.2026`; `en-US`: `Nov 14, 2026`); event times add `HH:mm UTC`.

### Numbering
Positions come from the full release order (`compareEntries`) before filtering, so a filter never renumbers.

### Data model
`Release { version @id, date }`, replaced as a whole on every publish inside the publish transaction.
