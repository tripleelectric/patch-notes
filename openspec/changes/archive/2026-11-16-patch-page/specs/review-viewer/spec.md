# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Entry page
**Reason**: Entries are shown in full on their release page.
**Migration**: Use `/releases/<release>#entry-<id>`; `/entries/<id>` redirects there (see "Entry permalink").

## ADDED Requirements

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
