# Authentication API

**Status:** Proposed contract — confirm fields and Spring Security configuration before implementation.

## AUTH-001 — Register

`POST /api/v1/auth/register`

**Authentication:** Public  
**CSRF:** Required if the chosen security setup requires CSRF on anonymous state-changing requests; define the bootstrap flow before implementation.

Request (illustrative; field names depend on approved auth decision):
```json
{
  "email": "person@example.com",
  "password": "example-only-not-a-real-password"
}
```

Response `201 Created` (illustrative):
```json
{
  "user": {
    "id": "uuid",
    "email": "person@example.com",
    "onboardingComplete": false
  }
}
```

Behavior:
- Validate approved identifier and password policy.
- Never store plaintext passwords.
- Do not reveal sensitive account-existence information.
- Create a session only if the agreed registration flow signs the user in automatically.
- Return no password/hash/session identifier in JSON.

**TBD:** Email vs phone vs username, verification, response/session behavior, duplicate response, rate limiting.

## AUTH-002 — Sign in

`POST /api/v1/auth/login`

Request (proposed):
```json
{
  "email": "person@example.com",
  "password": "example-only-not-a-real-password"
}
```

Response `200 OK`:
```json
{
  "user": {
    "id": "uuid",
    "email": "person@example.com",
    "onboardingComplete": true
  }
}
```

Session cookie is set via `Set-Cookie`; it must not be returned as a JSON field. Session ID rotation is required after successful authentication.

Invalid credentials: proposed `401` with a generic message.

## AUTH-003 — Current session/user

`GET /api/v1/auth/me`

**Authentication:** Required

Response `200 OK`:
```json
{
  "user": {
    "id": "uuid",
    "email": "person@example.com",
    "onboardingComplete": true
  }
}
```

No valid session: `401 Unauthorized`.

## AUTH-004 — Sign out

`POST /api/v1/auth/logout`

**Authentication:** Required  
**CSRF:** Required under cookie-authenticated CSRF protection.

Proposed response: `204 No Content`; server invalidates session and clears cookie using matching cookie attributes.

## AUTH-005 — Recover access (not yet specified)

Candidate route: `POST /api/v1/auth/recovery`

**Status:** Not ready for implementation. Do not implement until the identifier, verification, token expiry, abuse protection, and user messaging are approved.

## Authentication security requirements

- Hash passwords with a maintained password-hashing algorithm through Spring Security-supported mechanisms.
- Do not log credentials, cookies, session IDs, CSRF tokens, or recovery tokens.
- Rate limit login/register/recovery as appropriate before public launch.
- Protect every non-public endpoint independently of frontend route guards.
- Exact request DTOs and response schemas must be represented in `openapi.yaml` after owner approval.
