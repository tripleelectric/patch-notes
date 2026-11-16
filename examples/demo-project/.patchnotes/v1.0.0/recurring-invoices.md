---
id: recurring-invoices
title: Wiederkehrende Rechnungen
type: feature
date: 2026-10-06
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000101
try: /invoices/recurring
---
## Was hat sich geändert
Rechnungen können sich monatlich, quartalsweise oder jährlich wiederholen. Acme Billing erstellt die nächste Rechnung am Stichtag und verschickt sie mit der gewohnten Vorlage des Kunden.

## Warum
Rechnungen für Retainer-Kunden wurden jeden Monat von Hand aus der Vormonatsrechnung kopiert.

## Entscheidungen
- Der erste Zyklus startet als Entwurf, danach wird automatisch versendet.
- Noch keine freien Intervalle (z. B. alle 6 Wochen).
