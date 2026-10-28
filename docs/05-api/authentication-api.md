# Authentication API

**Status:** Proposed contract — confirm fields and Spring Security configuration before implementation.

## AUTH-001 — Register

`POST /api/v1/auth/register`

**Implementation status:** Implemented in DIV-005. This document remains PROPOSED. The decisions it applies, `DEC-021` to `DEC-024` and `DEC-026`, were approved by the project owner on 2026-10-28; `DEC-025` is OPEN. See the [decision log](../00-governance/decision-log.md).

**Authentication:** Public. No credentials are required, and an `Authorization` header is ignored.

**CSRF:** Not enforced today, because CSRF is disabled in the current interim configuration. The CSRF bootstrap for this anonymous request must be defined with the session design in DIV-006.

Request:
```json
{
  "email": "person@example.com",
  "password": "example-only-not-a-real-password",
  "displayName": "Sample User"
}
```

| Field | Rule |
|---|---|
| `email` | Required. Trimmed and lower-cased with `Locale.ROOT` before validation and storage (`DEC-023`). Must be a valid email address, at most 255 characters. |
| `password` | Required, not blank, 8–72 characters, and at most 72 bytes when UTF-8 encoded (the bcrypt input limit). Never trimmed or altered. |
| `displayName` | Required (`DEC-021`). Trimmed before validation; 1–100 characters after trimming. Must not contain the NUL character (U+0000), which the database cannot store. |

Unknown fields are ignored, not rejected (`DEC-026`). The server always generates the user ID; a client-supplied `id` has no effect.

Response `201 Created`:
```json
{
  "user": {
    "id": "uuid",
    "email": "person@example.com",
    "onboardingComplete": false
  }
}
```

`user.email` is the normalized email. `onboardingComplete` is always `false` because no onboarding flow exists yet. No password, hash, session identifier, or cookie is returned.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A field is missing or invalid. `fieldErrors` is keyed by `email`, `password` or `displayName`. |
| 400 | `MALFORMED_REQUEST` | The body is not readable JSON. |
| 409 | `REGISTRATION_CONFLICT` | The normalized email is already registered. Message: "We couldn't create an account with these details." (`DEC-022`). The body never contains the submitted email. |

The `409` status still reveals that an account exists for that email. Rate limiting is required before public release (see the non-functional requirements).

Behavior:
- Passwords are stored only as bcrypt hashes through Spring Security's delegating password encoder (`{bcrypt}` prefix). Plaintext is never stored or returned.
- Duplicate detection relies on the database unique constraint on `app_users.email`. That constraint is case-sensitive, so email uniqueness ignores case only because every write through this API uses the normalized form. Future login must apply the same normalization (`DEC-023`).
- **Registration does not create a session or sign the user in.** Whether it should is OPEN and deferred to DIV-006 (`DEC-025`). Until then, a client must not treat a `201` as an authenticated state.

**TBD:** Email verification, account recovery, rate limiting, and the DIV-006 decision on signing in at registration.

## AUTH-002 — Sign in

`POST /api/v1/auth/login`

**Implementation status:** Not implemented. Login, sessions, cookies and CSRF are to be defined and implemented in DIV-006; everything below in AUTH-002 to AUTH-004 is the proposed target. The submitted email must be normalized exactly as at registration (`DEC-023`).

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

**Implementation status:** Not implemented (DIV-006).

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

**Implementation status:** Not implemented (DIV-006).

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
