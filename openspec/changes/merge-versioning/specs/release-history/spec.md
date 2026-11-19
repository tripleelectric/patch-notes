# Spec Delta

## Purpose

Derives every release, its version number and its ship date from the git history of the project's release branch, so each merge is a release without any manual step or extra commit.

## ADDED Requirements

### Requirement: One release per merge
Every commit in the first-parent history of the configured branch that adds an entry file whose id never existed before in that history SHALL be one release. Commits that add no new entry id SHALL NOT be releases. The release contains exactly the entries whose id it added first.

#### Scenario: Merge with two entries
- **WHEN** a merge commit on `main` adds `.patchnotes/a.md` and `.patchnotes/b.md`
- **THEN** `a` and `b` belong to the same release

#### Scenario: Merge without entries
- **WHEN** a merge commit on `main` changes only code
- **THEN** no release is created for it

#### Scenario: Direct commit
- **WHEN** a commit pushed directly to `main` adds `.patchnotes/c.md`
- **THEN** that commit is a release containing `c`

#### Scenario: Commits inside a merged branch
- **WHEN** a feature branch has three commits and is merged into `main` with a merge commit
- **THEN** only the merge commit is a release, not the branch commits

### Requirement: First appearance wins
An entry SHALL keep the release of the first commit that added its id, also when the entry is edited, moved or deleted and added again later.

#### Scenario: Edited entry
- **WHEN** entry `a` shipped in release `0.2.0` and a later merge changes its body
- **THEN** `a` still belongs to `0.2.0` and the later merge is no release for `a`

#### Scenario: Moved entry
- **WHEN** a commit moves `.patchnotes/v0.3.1/a.md` to `.patchnotes/a.md`
- **THEN** `a` keeps the release of the commit that first added `a`

### Requirement: Version numbers
Releases SHALL be numbered in commit order starting from `0.0.0`. A release adding at least one `feature` entry SHALL bump the minor version, otherwise the patch version. The type SHALL be read from the entry as it was in the releasing commit; an entry unreadable there counts as a patch.

#### Scenario: Feature then fix
- **WHEN** the first release adds a feature and the second only a fix
- **THEN** they are `0.1.0` and `0.1.1`

#### Scenario: Type changed later
- **WHEN** an entry added as `feature` is later changed to `fix`
- **THEN** no version number changes

### Requirement: Stable numbers
Version numbers SHALL depend only on the branch history, so the same history always yields the same versions, and deleting an entry later SHALL NOT renumber any release.

#### Scenario: Deleted entry
- **WHEN** the only entry of release `0.2.0` is deleted in a later commit
- **THEN** every other release keeps its number

### Requirement: Ship date
The ship date of a release SHALL be the committer date of its commit, as `YYYY-MM-DD` in the commit's time zone.

#### Scenario: Merge date
- **WHEN** the release commit was committed on `2026-11-18T23:30:00+01:00`
- **THEN** the ship date is `2026-11-18`
