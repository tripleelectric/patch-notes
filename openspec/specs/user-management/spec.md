# user-management Specification

## Purpose

Lets one project team control access to its patch-notes server: the first admin is bootstrapped from the environment, everyone else joins through single-use invite links, and admins manage roles.

## Requirements

### Requirement: Roles
Every user SHALL have exactly one role: `admin` or `reviewer`. Only admins SHALL access `/admin/*`; reviewers SHALL receive `403` there.

#### Scenario: Reviewer opens admin page
- **WHEN** a reviewer requests `/admin/users`
- **THEN** the response is `403`

### Requirement: Admin bootstrap
When the database has no users and both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, the server SHALL create an admin with these credentials at startup. When users exist, the variables SHALL have no effect.

#### Scenario: First start
- **WHEN** the server starts with an empty database, `ADMIN_EMAIL=lead@example.com` and a valid `ADMIN_PASSWORD`
- **THEN** `lead@example.com` can log in and has the role `admin`

#### Scenario: Later start
- **WHEN** users exist and `ADMIN_PASSWORD` changed
- **THEN** the stored password is unchanged

### Requirement: Invite links
An admin SHALL create an invite for an email and role. The server SHALL show the invite link `<BASE_URL>/invite/<token>` once, store only a hash of the token and expire it after 7 days. An invite for an email that already has a user SHALL be rejected; a new invite for an email with a pending invite SHALL replace it.

#### Scenario: Create invite
- **WHEN** an admin invites `pm@example.com` as `reviewer`
- **THEN** the page shows a link starting with `BASE_URL/invite/` and the invite is listed as pending

#### Scenario: Existing user
- **WHEN** an admin invites the email of an existing user
- **THEN** no invite is created and an error says the user exists

### Requirement: Accept invite
`/invite/<token>` SHALL show a form for name and password (at least 10 characters, entered twice). Submitting a valid form SHALL create the user with the invited email and role, mark the invite used, log the user in and redirect to `/`. Unknown, expired, revoked or used tokens SHALL show an "invite invalid or expired" page with status `404`.

#### Scenario: Accept
- **WHEN** an invitee submits name `Pat` and matching 12-character passwords
- **THEN** user `pat` exists with the invited role, is logged in and the token no longer works

#### Scenario: Short password
- **WHEN** the password has 9 characters
- **THEN** the form shows an error and no user is created

#### Scenario: Expired invite
- **WHEN** the invite is older than 7 days
- **THEN** the page has status `404`

### Requirement: Manage users
`/admin/users` SHALL list users (name, email, role) and pending invites. Admins SHALL change a user's role, remove a user (ending their sessions) and revoke pending invites. The last admin SHALL NOT be demoted or removed, and admins SHALL NOT remove themselves.

#### Scenario: Promote reviewer
- **WHEN** an admin sets a reviewer's role to `admin`
- **THEN** that user can open `/admin/users`

#### Scenario: Last admin
- **WHEN** the only admin tries to set their role to `reviewer`
- **THEN** the role stays `admin` and an error is shown

#### Scenario: Remove user
- **WHEN** an admin removes a reviewer
- **THEN** the reviewer's existing session no longer grants access
