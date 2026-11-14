---
id: due-date-timezone
title: Due dates no longer shift by one day
type: fix
date: 2026-10-14
requests:
  - https://github.com/acme/billing/issues/212
---
## What changed
Invoices created late in the evening showed a due date one day too early. Due dates are now calculated in the company's time zone.
