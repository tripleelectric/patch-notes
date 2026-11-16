# Spec Delta

## MODIFIED Requirements

### Requirement: Configuration from environment
The server SHALL read its configuration only from environment variables: `DATA_DIR` (default `./data`), `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `BASE_URL` (required, absolute `http`/`https` URL under which the server is reachable), `LANGUAGE` (`en` or `de`, default `en`), and the optional `AUTH_SECRET` (at least 32 characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters) and `PUBLISH_TOKEN` (at least 32 characters). Invalid or missing required values SHALL stop startup with an error naming each variable.

#### Scenario: Missing BASE_URL
- **WHEN** the server starts without `BASE_URL`
- **THEN** it exits with a non-zero code and the error names `BASE_URL`

#### Scenario: Defaults
- **WHEN** only `BASE_URL` is set
- **THEN** the server listens on `0.0.0.0:3000`, stores data in `./data` and uses English

#### Scenario: Short auth secret
- **WHEN** `AUTH_SECRET` has fewer than 32 characters
- **THEN** startup fails and the error names `AUTH_SECRET`

#### Scenario: Short publish token
- **WHEN** `PUBLISH_TOKEN` has fewer than 32 characters
- **THEN** startup fails and the error names `PUBLISH_TOKEN`

#### Scenario: Unsupported language
- **WHEN** `LANGUAGE` is `fr`
- **THEN** startup fails and the error names `LANGUAGE`
