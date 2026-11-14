# server-runtime Specification

## Purpose

Defines how the patch-notes server is configured, where it keeps its data, how it starts and how a container platform runs and monitors it.

## Requirements

### Requirement: Configuration from environment
The server SHALL read its configuration only from environment variables: `DATA_DIR` (default `./data`), `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `BASE_URL` (required, absolute `http`/`https` URL under which the server is reachable), and the optional `AUTH_SECRET` (at least 32 characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters) and `PUBLISH_TOKEN` (at least 32 characters). Invalid or missing required values SHALL stop startup with an error naming each variable.

#### Scenario: Missing BASE_URL
- **WHEN** the server starts without `BASE_URL`
- **THEN** it exits with a non-zero code and the error names `BASE_URL`

#### Scenario: Defaults
- **WHEN** only `BASE_URL` is set
- **THEN** the server listens on `0.0.0.0:3000` and stores data in `./data`

#### Scenario: Short auth secret
- **WHEN** `AUTH_SECRET` has fewer than 32 characters
- **THEN** startup fails and the error names `AUTH_SECRET`

#### Scenario: Short publish token
- **WHEN** `PUBLISH_TOKEN` has fewer than 32 characters
- **THEN** startup fails and the error names `PUBLISH_TOKEN`

### Requirement: Data directory
All persistent state SHALL live in `DATA_DIR`. The server SHALL create the directory if missing and keep the SQLite database at `DATA_DIR/patchnotes.db`.

#### Scenario: Fresh data directory
- **WHEN** the server starts with an empty or missing `DATA_DIR`
- **THEN** the directory and the database file exist after startup

### Requirement: Migrations on start
On startup the server SHALL apply all pending database migrations before accepting requests. A failed migration SHALL stop startup.

#### Scenario: Restart with existing data
- **WHEN** the server restarts with a database from a previous start
- **THEN** existing data is kept and startup succeeds

### Requirement: Health check
`GET /healthz` SHALL respond `200` with `{"status":"ok"}` when the database answers a query, and `503` otherwise. It SHALL NOT require authentication.

#### Scenario: Healthy
- **WHEN** the server runs with a reachable database
- **THEN** `GET /healthz` returns `200` and `{"status":"ok"}`

### Requirement: Local static assets
CSS and JavaScript used by pages SHALL be served by the server itself under `/assets/`, without third-party CDNs.

#### Scenario: Stylesheet and htmx
- **WHEN** a page is rendered
- **THEN** it references `/assets/app.css` and `/assets/htmx.min.js`, and both return `200`

### Requirement: HTML security headers
HTML responses SHALL send a `Content-Security-Policy` that allows scripts, styles and images only from the server's own origin, and SHALL send `X-Content-Type-Options: nosniff`.

#### Scenario: Page headers
- **WHEN** any HTML page is requested
- **THEN** the response carries both headers

### Requirement: Container image
The repository SHALL build one container image that runs the server as a non-root user, declares `/data` as the data volume and uses `DATA_DIR=/data` by default.

#### Scenario: Container start
- **WHEN** the image runs with `BASE_URL` set and a volume on `/data`
- **THEN** `GET /healthz` returns `200`
