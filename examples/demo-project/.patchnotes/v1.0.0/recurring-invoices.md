---
id: recurring-invoices
title: Recurring invoices
type: feature
date: 2026-10-06
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000101
try: /invoices/recurring
---
## What changed
Invoices can repeat monthly, quarterly or yearly. Acme Billing creates the next invoice on the due day and sends it with the customer's usual template.

## Why
Retainer customers were billed by copying last month's invoice by hand.

## Decisions
- Recurring invoices start as drafts for the first cycle, then send automatically.
- No custom intervals yet (every 6 weeks etc.).
