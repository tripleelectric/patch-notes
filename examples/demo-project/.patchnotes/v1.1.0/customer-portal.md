---
id: customer-portal
title: Customer portal with all invoices
type: feature
date: 2026-11-03
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000110
try: /portal
media:
  - image: media/portal.png
    caption: Customers see open, overdue and paid totals at a glance.
---
## What changed
Customers get a personal link to a portal that lists all their invoices, lets them download PDFs and pay everything that is open in one go.

## Why
Support answered several "can you resend invoice X" emails per day.

## Decisions
- Access by magic link only, no customer passwords.
- The portal shows the last 24 months.
