# Spec Delta

## MODIFIED Requirements

### Requirement: Configuration from environment
The server SHALL read its configuration only from environment variables: `DATA_DIR` (default `./data`), `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `BASE_URL` (required, absolute `http`/`https` URL under which the server is reachable), and the optional `AUTH_SECRET` (at least 32 characters), `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 10 characters). Invalid or missing required values SHALL stop startup with an error naming each variable.

#### Scenario: Missing BASE_URL
- **WHEN** the server starts without `BASE_URL`
- **THEN** it exits with a non-zero code and the error names `BASE_URL`

#### Scenario: Defaults
- **WHEN** only `BASE_URL` is set
- **THEN** the server listens on `0.0.0.0:3000` and stores data in `./data`

#### Scenario: Short auth secret
- **WHEN** `AUTH_SECRET` has fewer than 32 characters
- **THEN** startup fails and the error names `AUTH_SECRET`
