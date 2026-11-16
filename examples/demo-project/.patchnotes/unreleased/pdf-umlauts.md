---
id: pdf-umlauts
title: Umlaute in Rechnungs-PDFs
type: fix
date: 2026-11-10
requests:
  - https://github.com/acme/billing/issues/241
media:
  - before: media/pdf-before.png
    after: media/pdf-after.png
    caption: Kundennamen und Adressen mit ä, ö, ü und ß.
---
## Was hat sich geändert
Namen und Adressen mit Umlauten oder ß wurden in PDF-Rechnungen als Fragezeichen gedruckt. Der PDF-Renderer bettet jetzt eine Schrift mit vollständigem lateinischem Zeichensatz ein.
