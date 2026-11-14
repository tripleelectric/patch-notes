# Spec Delta

## Purpose

Controls who can see the patch-notes server: users log in with email and password, and every page except the public entry points requires a valid session.

## ADDED Requirements

### Requirement: Login with email and password
`GET /login` SHALL show a login form. A correct email and password SHALL start a session stored in an HTTP-only cookie and redirect to the requested page, or `/` when none was requested. Wrong credentials SHALL show the same generic error for an unknown email and a wrong password.

#### Scenario: Successful login
- **WHEN** a user submits correct credentials with `next=/admin/users`
- **THEN** the response sets a session cookie and redirects to `/admin/users`

#### Scenario: Wrong password
- **WHEN** a user submits a wrong password
- **THEN** the login form is shown again with status `401` and the message "Invalid email or password"

#### Scenario: Open redirect
- **WHEN** a user logs in with `next=//evil.example.com`
- **THEN** the redirect goes to `/`

### Requirement: Logout
`POST /logout` SHALL end the session and redirect to `/login`.

#### Scenario: Logout
- **WHEN** a logged-in user posts to `/logout`
- **THEN** the session no longer grants access to `/`

### Requirement: Pages require a session
All routes except `/login`, `/invite/*`, `/healthz`, `/assets/*` and machine API routes under `/api/` SHALL require a session. Page requests without a session SHALL redirect to `/login?next=<path>`; htmx requests SHALL receive `401`.

#### Scenario: Anonymous page request
- **WHEN** an anonymous user requests `/admin/users`
- **THEN** the response redirects to `/login?next=%2Fadmin%2Fusers`

#### Scenario: Anonymous htmx request
- **WHEN** an anonymous request with header `HX-Request: true` hits a protected route
- **THEN** the response status is `401`

### Requirement: Cross-site form posts rejected
Form submissions (`POST`, `PUT`, `PATCH`, `DELETE` outside `/api/`) SHALL be rejected with `403` unless their `Origin` header, or `Referer` when `Origin` is missing, matches the origin of `BASE_URL`.

#### Scenario: Foreign origin
- **WHEN** a logged-in user's browser posts to `/logout` with `Origin: https://evil.example.com`
- **THEN** the response is `403` and the session stays valid

### Requirement: Login rate limit
Login and invite acceptance submissions SHALL be limited to 10 per minute per client address; further attempts SHALL receive `429`.

#### Scenario: Brute force
- **WHEN** a client submits the login form 11 times within one minute
- **THEN** the eleventh response is `429`

### Requirement: Auth secret
Sessions SHALL be signed with `AUTH_SECRET` when set (at least 32 characters). Without it, the server SHALL generate a random secret once, store it in `DATA_DIR` readable only by the server user, and reuse it on later starts.

#### Scenario: Restart without AUTH_SECRET
- **WHEN** the server restarts with the same `DATA_DIR` and no `AUTH_SECRET`
- **THEN** sessions created before the restart stay valid
