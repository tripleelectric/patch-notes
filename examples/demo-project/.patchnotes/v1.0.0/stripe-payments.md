---
id: stripe-payments
title: Card payments via Stripe
type: feature
date: 2026-10-09
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000102
---
## What changed
Every invoice email contains a "Pay now" link. Customers pay by card or SEPA direct debit; the invoice is marked as paid automatically.

## Decisions
- Stripe fees are not added to the invoice amount.
