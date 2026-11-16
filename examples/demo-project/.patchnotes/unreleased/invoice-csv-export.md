---
id: invoice-csv-export
title: Rechnungen als CSV exportieren
type: feature
date: 2026-11-13
requests:
  - https://app.asana.com/0/1208000000000001/1208000000000120
try: /invoices?export=1
media:
  - before: media/invoices-before.png
    after: media/invoices-after.png
    caption: Der Export-Button sitzt neben „Neue Rechnung“ und exportiert genau das, was der Filter zeigt.
---
## Was hat sich geändert
Die Rechnungsliste hat einen Button **Als CSV exportieren**. Er exportiert die Rechnungen des aktuellen Filters oder alle Rechnungen des laufenden Jahres.

## Warum
Die Buchhaltung importiert Rechnungen jeden Monat in DATEV und hat sie bisher aus PDFs abgetippt.

## Entscheidungen
- Nur CSV, kein XLSX: DATEV und jedes Tabellenprogramm lesen CSV.
- Semikolon als Trennzeichen und Komma als Dezimalzeichen, weil die Hauptnutzer mit deutschem Excel arbeiten.
- Höchstens 10.000 Rechnungen pro Export; größere Exporte über den Support.
