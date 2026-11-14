---
id: pdf-umlauts
title: Umlauts in invoice PDFs
type: fix
date: 2026-11-10
requests:
  - https://github.com/acme/billing/issues/241
media:
  - before: media/pdf-before.png
    after: media/pdf-after.png
    caption: Customer names and addresses with ä, ö, ü and ß.
---
## What changed
Names and addresses with umlauts or ß were printed as question marks in PDF invoices. The PDF renderer now embeds a font with full Latin coverage.
