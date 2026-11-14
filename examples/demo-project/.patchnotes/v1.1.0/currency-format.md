---
id: currency-format
title: Amounts use the customer's locale
type: fix
date: 2026-11-06
---
## What changed
Amounts in emails and PDFs are formatted for the customer's country (`1.240,00 €` in Germany, `€1,240.00` in Ireland) instead of always using the German format.
