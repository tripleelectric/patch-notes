---
id: due-date-timezone
title: Fälligkeitsdatum verschiebt sich nicht mehr um einen Tag
type: fix
date: 2026-10-14
requests:
  - https://github.com/acme/billing/issues/212
---
## Was hat sich geändert
Rechnungen, die spätabends erstellt wurden, zeigten ein um einen Tag zu frühes Fälligkeitsdatum. Fälligkeiten werden jetzt in der Zeitzone des Unternehmens berechnet.
