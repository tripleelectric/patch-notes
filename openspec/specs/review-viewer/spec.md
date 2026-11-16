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
Every release page SHALL show all releases with entries, Unreleased first, then versions from highest to lowest, each with its entry count. Under the current release it SHALL list that release's entries as links to their anchors, each with its review status.

#### Scenario: Version ordering
- **WHEN** versions `1.2.0`, `1.10.0` and `1.9.1` exist
- **THEN** the release navigation lists them as `1.10.0`, `1.9.1`, `1.2.0`

#### Scenario: Entry links
- **WHEN** a user opens a release containing entry `invoice-export`
- **THEN** the navigation links to `#entry-invoice-export` and shows that entry's status

### Requirement: Review progress
Each release page SHALL show how many of its entries are accepted, have changes requested and await review.

#### Scenario: Mixed statuses
- **WHEN** a release has 2 accepted, 1 changes-requested and 1 awaiting-review entry
- **THEN** the page shows "2 of 4 accepted", "1 changes requested" and "1 awaiting review"

### Requirement: Status filter
A release page SHALL accept `?status=awaiting-review|accepted|changes-requested` and then list only entries with that status.

#### Scenario: Only awaiting
- **WHEN** a user opens `/releases/unreleased?status=awaiting-review`
- **THEN** only entries awaiting review are listed

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
