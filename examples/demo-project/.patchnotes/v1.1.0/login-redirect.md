---
id: login-redirect
title: Login returns to the page you came from
type: fix
date: 2026-11-05
requests:
  - https://github.com/acme/billing/issues/230
---
## What changed
After a session expired, logging in always opened the dashboard. Now it returns to the page you were on, for example a half-finished invoice.
