---
id: vat-rounding
title: VAT rounded per invoice, not per line
type: fix
date: 2026-11-09
requests:
  - https://github.com/acme/billing/issues/238
---
## What changed
VAT is now calculated on the invoice total and rounded once. Invoices with many small lines could be off by a few cents compared to the tax office's calculation.

## Decisions
- Existing invoices are not recalculated.
