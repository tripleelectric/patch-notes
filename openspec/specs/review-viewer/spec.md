# review-viewer Specification

## Purpose

Shows reviewers what shipped, release by release and entry by entry, with everything needed to judge an entry on one page.

## Requirements

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
`/entries/<id>` SHALL redirect to `/#entry-<id>` for entries that are not removed. For removed entries it SHALL show the entry with a notice that it was removed from the repository and without review actions. Unknown ids SHALL return `404`.

#### Scenario: Permalink
- **WHEN** a user opens `/entries/invoice-export` of an unreleased entry
- **THEN** the response redirects to `/#entry-invoice-export`

#### Scenario: Removed entry
- **WHEN** an entry was removed by the last publish
- **THEN** `/entries/<id>` shows a removed notice and no review actions

#### Scenario: Before and after
- **WHEN** an entry has a before/after media item
- **THEN** its expanded row shows both images labelled "Before" and "After"

### Requirement: Position numbers
Each entry SHALL show its position number within its release, 1 to n in release order (type: features, fixes, changes; then newest date first). Numbers SHALL stay the same when a filter is active.

#### Scenario: Numbers in order
- **WHEN** a release has a feature and a fix
- **THEN** the feature is number 1 and the fix number 2

#### Scenario: Filtered
- **WHEN** only the second entry has changes requested and the change request filter is active
- **THEN** that entry still shows number 2

### Requirement: Release date shown
Each released version on the release rail SHALL show its ship date: the published release date, or the newest entry date of the release when none was published. Unreleased SHALL be labelled as not yet released.

#### Scenario: Published date
- **WHEN** `1.0.0` was published with date `2026-10-15`
- **THEN** its rail item shows that date

#### Scenario: Fallback
- **WHEN** `1.1.0` has no published date and its newest entry is dated `2026-11-06`
- **THEN** its rail item shows `2026-11-06` formatted for the interface language

### Requirement: Interface language
All pages SHALL use the interface language set by `LANGUAGE` for labels, messages and date formats: English (`en`, default) or German (`de`). Entry content SHALL be shown as written.

#### Scenario: German interface
- **WHEN** the server runs with `LANGUAGE=de`
- **THEN** the login page shows "Anmelden", a change request reads "Änderungen angefragt", and dates read like `14.11.2026`

### Requirement: Changelog timeline
`/` SHALL show all releases with entries that are not removed, Unreleased first, then versions from highest to lowest, each as a section with the anchor `release-<release>`. Without entries it SHALL show an empty state explaining `patchnotes publish`.

#### Scenario: Version ordering
- **WHEN** versions `1.2.0`, `1.10.0` and `1.9.1` exist
- **THEN** the timeline lists them as `1.10.0`, `1.9.1`, `1.2.0`

#### Scenario: Nothing published
- **WHEN** no entries exist
- **THEN** `/` shows a hint to run `patchnotes publish`

### Requirement: Release rail
Each release section SHALL show, beside its entries, the release label, ship date or "not yet released", entry count and number of open change requests when there are any.

#### Scenario: Open requests on rail
- **WHEN** a release has one entry with changes requested
- **THEN** its rail item shows one open change request

### Requirement: Collapsed entries
Entries SHALL be rows showing position, type, title, a change request marker when flagged, feedback count and date, collapsed by default. Expanding a row SHALL show ticket links, try link, media, rendered body, feedback form and history. Navigating to an entry's anchor SHALL expand it.

#### Scenario: Collapsed by default
- **WHEN** a user opens `/`
- **THEN** every entry title is visible and entry bodies are collapsed

#### Scenario: Anchor expands
- **WHEN** a user opens `/#entry-invoice-export`
- **THEN** that entry is expanded and scrolled into view

### Requirement: Timeline filters
`/` SHALL accept `?show=feature|fix|change|changes-requested` and then list only matching entries, hiding releases without matches. The header SHALL offer these filters with their counts.

#### Scenario: Only fixes
- **WHEN** a user opens `/?show=fix`
- **THEN** only fix entries are listed

#### Scenario: Only change requests
- **WHEN** a user opens `/?show=changes-requested`
- **THEN** only entries with changes requested are listed

### Requirement: Release links
`/releases/unreleased` and `/releases/<X.Y.Z>` SHALL redirect to `/#release-<release>`; unknown or malformed releases SHALL return `404`.

#### Scenario: Release link
- **WHEN** a user opens `/releases/1.1.0` and that release has entries
- **THEN** the response redirects to `/#release-1.1.0`

#### Scenario: Unknown release
- **WHEN** a user opens `/releases/9.9.9`
- **THEN** the response is `404`

### Requirement: Color theme
Pages SHALL render in light or dark colors following the system setting by default. A control in the header SHALL switch between system, light and dark; the choice SHALL be stored in a cookie and applied on the server when rendering.

#### Scenario: Default follows system
- **WHEN** a user has made no choice
- **THEN** the page carries no fixed theme and follows `prefers-color-scheme`

#### Scenario: Dark chosen
- **WHEN** a user chooses dark
- **THEN** later pages render with the dark theme regardless of the system setting

### Requirement: Image viewer
Clicking an entry image SHALL open it in a modal viewer over the page instead of a new tab, showing the image at up to the viewport size with its caption. The viewer SHALL offer previous and next for the other images of the same entry, react to the arrow keys, and close with Escape, a close button or a click outside the image. Clicks with a modifier key SHALL keep the browser's default behavior.

#### Scenario: Open image
- **WHEN** a reviewer clicks the after image of an entry
- **THEN** a modal shows that image and the page stays in place behind it

#### Scenario: Step to the before image
- **WHEN** the viewer shows the after image and the reviewer presses the left arrow key
- **THEN** the viewer shows the before image of the same entry

#### Scenario: Without JavaScript
- **WHEN** scripts are disabled and a reviewer clicks an image
- **THEN** the image opens as a page in the same tab
