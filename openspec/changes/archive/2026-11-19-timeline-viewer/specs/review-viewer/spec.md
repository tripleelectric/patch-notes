# Spec Delta

## REMOVED Requirements

### Requirement: Default release
**Reason**: `/` is now the timeline of all releases.
**Migration**: Open `/`; see "Changelog timeline".

### Requirement: Release page
**Reason**: Releases are sections of the timeline.
**Migration**: `/releases/<release>` redirects to `/#release-<release>`; see "Release links".

### Requirement: Release navigation
**Reason**: The timeline's release rail replaces the sidebar.
**Migration**: See "Release rail".

### Requirement: Change request filter
**Reason**: Replaced by timeline-wide filters.
**Migration**: Use `/?show=changes-requested`; see "Timeline filters".

## MODIFIED Requirements

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

## ADDED Requirements

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
