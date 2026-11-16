---
id: login-redirect
title: Nach dem Login zurück zur vorherigen Seite
type: fix
date: 2026-11-05
requests:
  - https://github.com/acme/billing/issues/230
---
## Was hat sich geändert
Nach einer abgelaufenen Sitzung führte der Login immer zum Dashboard. Jetzt geht es zurück zur Seite, auf der man war, zum Beispiel zu einer halb fertigen Rechnung.
