---
id: vat-rounding
title: Umsatzsteuer pro Rechnung statt pro Position gerundet
type: fix
date: 2026-11-09
requests:
  - https://github.com/acme/billing/issues/238
---
## Was hat sich geändert
Die Umsatzsteuer wird jetzt auf die Rechnungssumme berechnet und einmal gerundet. Rechnungen mit vielen kleinen Positionen konnten sonst um einige Cent von der Berechnung des Finanzamts abweichen.

## Entscheidungen
- Bestehende Rechnungen werden nicht neu berechnet.
