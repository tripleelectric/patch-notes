# review-viewer Specification

## Purpose

Shows reviewers what shipped, release by release and entry by entry, with everything needed to judge an entry on one page.

## Requirements

### Requirement: Default release
`/` SHALL redirect to `/releases/unreleased` when unreleased entries exist, else to the highest released version, else show an empty state explaining `patchnotes publish`.

#### Scenario: Default release
- **WHEN** unreleased entries exist and a user opens `/`
- **THEN** the response redirects to `/releases/unreleased`

#### Scenario: Nothing published
- **WHEN** no entries exist
- **THEN** `/` shows a hint to run `patchnotes publish`

### Requirement: Release page
`/releases/unreleased` and `/releases/<X.Y.Z>` SHALL show all the release's entries that are not removed on one page, grouped by type in the order features, fixes, changes. Each entry SHALL be a collapsible section, expanded by default, with the anchor `entry-<id>`, showing title, type, date, review status, links, media, rendered body, review form and history. A release without entries SHALL return `404`.

#### Scenario: Grouped entries
- **WHEN** a release has a fix and a feature
- **THEN** the feature group is listed before the fix group

#### Scenario: Full entries on one page
- **WHEN** a user opens a release with two entries that have bodies and media
- **THEN** both bodies and all media are on the release page inside collapsible sections

#### Scenario: Unknown release
- **WHEN** a user opens `/releases/9.9.9` with no such entries
- **THEN** the response is `404`

### Requirement: Release navigation
Every release page SHALL show all releases with entries, Unreleased first, then versions from highest to lowest, each with its entry count and, when there are any, its number of open change requests. Under the current release it SHALL list that release's entries as links to their anchors, marking entries with changes requested.

#### Scenario: Version ordering
- **WHEN** versions `1.2.0`, `1.10.0` and `1.9.1` exist
- **THEN** the release navigation lists them as `1.10.0`, `1.9.1`, `1.2.0`

#### Scenario: Entry links
- **WHEN** a user opens a release containing entry `invoice-export` with changes requested
- **THEN** the navigation links to `#entry-invoice-export` and marks it as having changes requested

### Requirement: Try link
When an entry has `try`, the page SHALL show a "Try it" link: the URL itself when absolute, or the path appended to the published `appUrl`. Without an `appUrl` a path SHALL be shown as text, not as a link.

#### Scenario: Path with appUrl
- **WHEN** `try` is `/invoices?export=1` and `appUrl` is `https://app.example.com`
- **THEN** the link points to `https://app.example.com/invoices?export=1`

### Requirement: Safe content rendering
Entry bodies SHALL be rendered from markdown without passing through raw HTML, and links SHALL only use `http`, `https` or `mailto`. All other user-provided text (titles, captions, comments, names) SHALL be escaped.

#### Scenario: Script in body
- **WHEN** an entry body contains `<script>alert(1)</script>` and `[x](javascript:alert(1))`
- **THEN** the page contains neither a script element nor a `javascript:` link

### Requirement: Media delivery
`/media/<sha256>.<ext>` SHALL serve stored media files to logged-in users only, with their stored content type, support for range requests and a private cache header. Other names SHALL return `404`.

#### Scenario: Anonymous media request
- **WHEN** an anonymous user requests a media file
- **THEN** the response redirects to login and no file content is sent

#### Scenario: Video range
- **WHEN** a logged-in user requests a video with `Range: bytes=0-9`
- **THEN** the response is `206` with 10 bytes

### Requirement: Entry permalink
`/entries/<id>` SHALL redirect to `/releases/<release>#entry-<id>` for entries that are not removed. For removed entries it SHALL show the entry with a notice that it was removed from the repository and without review actions. Unknown ids SHALL return `404`.

#### Scenario: Permalink
- **WHEN** a user opens `/entries/invoice-export` of an unreleased entry
- **THEN** the response redirects to `/releases/unreleased#entry-invoice-export`

#### Scenario: Removed entry
- **WHEN** an entry was removed by the last publish
- **THEN** `/entries/<id>` shows a removed notice and no review actions

#### Scenario: Before and after
- **WHEN** an entry has a before/after media item
- **THEN** its section shows both images labelled "Before" and "After"

### Requirement: Position numbers
Each entry on a release page SHALL show its position number, 1 to n in release order, on its section and in the navigation. Numbers SHALL stay the same when a status filter is active.

#### Scenario: Numbers in order
- **WHEN** a release has a feature and a fix
- **THEN** the feature is number 1 and the fix number 2

#### Scenario: Filtered
- **WHEN** only the second entry awaits review and the awaiting-review filter is active
- **THEN** that entry still shows number 2

### Requirement: Release date shown
A released version's page header and navigation item SHALL show its ship date: the published release date, or the newest entry date of the release when none was published. Unreleased SHALL be labelled as not yet released.

#### Scenario: Published date
- **WHEN** `1.0.0` was published with date `2026-10-15`
- **THEN** its header and navigation item show that date

#### Scenario: Fallback
- **WHEN** `1.1.0` has no published date and its newest entry is dated `2026-11-06`
- **THEN** its header shows `2026-11-06` formatted for the interface language

### Requirement: Interface language
All pages SHALL use the interface language set by `LANGUAGE` for labels, messages and date formats: English (`en`, default) or German (`de`). Entry content SHALL be shown as written.

#### Scenario: German interface
- **WHEN** the server runs with `LANGUAGE=de`
- **THEN** the login page shows "Anmelden", a change request reads "Änderungen angefragt", and dates read like `14.11.2026`

### Requirement: Change request filter
A release page SHALL accept `?status=changes-requested` and then list only entries with an open change request; the filter SHALL be offered only when the release has such entries.

#### Scenario: Only change requests
- **WHEN** a user opens `/releases/unreleased?status=changes-requested`
- **THEN** only entries with changes requested are listed
