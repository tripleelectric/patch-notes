# Spec Delta

## MODIFIED Requirements

### Requirement: Entry permalink
`/entries/<id>` SHALL redirect to `/#entry-<id>` for entries that are not removed. For removed entries it SHALL show the entry with a notice that it was removed from the repository and without review actions. Unknown ids SHALL return `404`.

#### Scenario: Permalink
- **WHEN** a user opens `/entries/invoice-export` of a published entry
- **THEN** the response redirects to `/#entry-invoice-export`

#### Scenario: Removed entry
- **WHEN** an entry was removed by the last publish
- **THEN** `/entries/<id>` shows a removed notice and no review actions

#### Scenario: Before and after
- **WHEN** an entry has a before/after media item
- **THEN** its expanded row shows both images labelled "Before" and "After"

### Requirement: Release date shown
Each version on the release rail SHALL show its ship date: the published release date, or the newest entry date of the release when none was published.

#### Scenario: Published date
- **WHEN** `1.0.0` was published with date `2026-10-15`
- **THEN** its rail item shows that date

#### Scenario: Fallback
- **WHEN** `1.1.0` has no published date and its newest entry is dated `2026-11-06`
- **THEN** its rail item shows `2026-11-06` formatted for the interface language

### Requirement: Changelog timeline
`/` SHALL show all releases with entries that are not removed, versions from highest to lowest, each as a section with the anchor `release-<version>`. There SHALL be no Unreleased section. Without entries it SHALL show an empty state explaining `patchnotes publish`.

#### Scenario: Version ordering
- **WHEN** versions `1.2.0`, `1.10.0` and `1.9.1` exist
- **THEN** the timeline lists them as `1.10.0`, `1.9.1`, `1.2.0`

#### Scenario: Nothing published
- **WHEN** no entries exist
- **THEN** `/` shows a hint to run `patchnotes publish`

### Requirement: Release rail
Each release section SHALL show, beside its entries, the release label, ship date, entry count and number of open change requests when there are any.

#### Scenario: Open requests on rail
- **WHEN** a release has one entry with changes requested
- **THEN** its rail item shows one open change request

### Requirement: Release links
`/releases/<X.Y.Z>` SHALL redirect to `/#release-<X.Y.Z>`; unknown or malformed releases, including `unreleased`, SHALL return `404`.

#### Scenario: Release link
- **WHEN** a user opens `/releases/1.1.0` and that release has entries
- **THEN** the response redirects to `/#release-1.1.0`

#### Scenario: Unknown release
- **WHEN** a user opens `/releases/9.9.9` or `/releases/unreleased`
- **THEN** the response is `404`
