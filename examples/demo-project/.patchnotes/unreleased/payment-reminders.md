---
id: payment-reminders
title: Automatic payment reminders
type: feature
date: 2026-11-12
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000121
  - https://app.asana.com/0/1208000000000001/1208000000000122
try: /settings/reminders
media:
  - image: media/reminders.png
    caption: Three reminder levels, each can be switched off.
---
## What changed
Overdue invoices trigger up to three reminder emails. Each level has its own delay and text; the final notice can add a late fee.

## Why
Overdue invoices were chased by hand from a spreadsheet; 30 % of them were reminded late or not at all.

## Decisions
- Reminders are never sent on weekends or public holidays.
- Late fees are opt-in per customer.
