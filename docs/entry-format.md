# Entry format

A patch note entry is one shipped change, written as a markdown file with YAML frontmatter. Entries live in the consuming project's repository, which is their source of truth. The schema is implemented in `packages/schema`.

## Directory layout

```
.patchnotes/
  unreleased/            entries not yet released
    invoice-export.md
  v1.4.0/                one directory per release, named vMAJOR.MINOR.PATCH
    login-redirect.md
  media/                 images and videos referenced by entries
    invoice-before.png
```

- The directory an entry lives in is its release. Releasing means moving the file from `unreleased/` to a version directory.
- Entry ids are unique across all releases.

## Fields

| Field | Required | Rules |
| --- | --- | --- |
| `id` | yes | kebab-case, 1 to 80 characters, equals the file name without `.md` |
| `title` | yes | 1 to 120 characters |
| `type` | yes | `feature`, `fix` or `change` |
| `date` | yes | calendar date `YYYY-MM-DD` |
| `requests` | no | list of absolute `http`/`https` URLs to the originating requests in any tracker |
| `try` | no | absolute `http`/`https` URL, or a path starting with `/` resolved against `appUrl` |
| `media` | no | list of items, each exactly one of `image`, `video`, or `before` and `after`; optional `caption` |

- Media paths are relative to the patch notes directory (not to the entry file), so they stay valid when an entry moves on release. Absolute paths, `..` segments and backslashes are rejected.
- Unknown fields are rejected, so typos surface early.
- Review status is not part of an entry. The server owns it, so publishing never overwrites review results. A `status` field is rejected.
- What changed, why and the decisions taken go in the markdown body.

## Example entry

`.patchnotes/unreleased/invoice-export.md`:

```md
---
id: invoice-export
title: Invoice export as CSV
type: feature
date: 2026-11-14
requests:
  - https://app.asana.com/0/1200000000000000/1200000000000001
media:
  - before: media/invoice-before.png
    after: media/invoice-after.png
    caption: Export button in the invoice list
  - video: media/invoice-flow.webm
try: /invoices?export=1
---
## What changed
Invoices can be exported as a CSV file from the invoice list.

## Why
Accounting imports invoices into their own tool every month.

## Decisions
- CSV only, no XLSX
```

## Project config

`patchnotes.yaml` at the project root. All fields are optional; an empty file is valid.

| Field | Default | Rules |
| --- | --- | --- |
| `dir` | `.patchnotes` | relative path inside the project |
| `server` | none | absolute `http`/`https` URL of the patch-notes server |
| `appUrl` | none | absolute `http`/`https` URL used to resolve path `try` links |

```yaml
dir: .patchnotes
server: https://patchnotes.example.com
appUrl: https://app.example.com
```

The publish token is never stored in this file. It comes from the `PATCHNOTES_TOKEN` environment variable; a `token` field is rejected.
