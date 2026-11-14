---
id: invoice-csv-export
title: Export invoices as CSV
type: feature
date: 2026-11-13
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000120
try: /invoices?export=1
media:
  - before: media/invoices-before.png
    after: media/invoices-after.png
    caption: The export button sits next to "New invoice" and exports exactly what the filter shows.
---
## What changed
The invoice list has an **Export as CSV** button. It exports the invoices matching the current filter, or all invoices of the current year.

## Why
Accounting imports invoices into DATEV every month and typed them over from PDFs.

## Decisions
- CSV only, no XLSX: DATEV and every spreadsheet tool read CSV.
- Semicolon as separator and comma as decimal mark, because the main users work with German Excel.
- At most 10,000 invoices per export; larger exports need a support request.
