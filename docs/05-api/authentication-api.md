# Authentication API

**Status:** Proposed contract. AUTH-001 to AUTH-004 and AUTH-006 are implemented (DIV-005, DIV-006); AUTH-007 and AUTH-008 are implemented (DIV-029, `DEC-045`). The contract itself is not frozen.

Decisions applied: `DEC-021` to `DEC-027` are approved by the project owner; the session, cookie and CSRF settings described here are `DEC-027`. See the [decision log](../00-governance/decision-log.md). The [frontend integration](#frontend-integration) section at the end describes the call order for a browser client.

## AUTH-001 — Register

`POST /api/v1/auth/register`

**Implementation status:** Implemented in DIV-005; CSRF protection added in DIV-006.

**Authentication:** Public. No credentials are required, and an `Authorization` header is ignored.

**CSRF:** Required. Send the token from [AUTH-006](#auth-006--csrf-token) in the `X-XSRF-TOKEN` header; the browser sends the CSRF cookie itself. A missing or wrong token gets `403 CSRF_INVALID` and no account is created.

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
    "displayName": "Sample User",
    "onboardingComplete": false
  }
}
```

`user.email` is the normalized email. `displayName` is the trimmed name (added with DIV-022; additive). `onboardingComplete` is `false` for a new account until onboarding is finished or skipped ([PROFILE-003](profile-api.md#profile-003--complete-onboarding), `DEC-044`). No password, hash, session identifier, or cookie is returned.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A field is missing or invalid. `fieldErrors` is keyed by `email`, `password` or `displayName`. |
| 400 | `MALFORMED_REQUEST` | The body is not readable JSON. |
| 403 | `CSRF_INVALID` | The CSRF token is missing or does not match the cookie. |
| 409 | `REGISTRATION_CONFLICT` | The normalized email is already registered. Message: "We couldn't create an account with these details." (`DEC-022`). The body never contains the submitted email. |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests from the client IP within the configured sliding window (default 10 requests / 1 min). Includes `Retry-After` header. |

The `409` status still reveals that an account exists for that email. Rate limiting is enforced per client IP before processing requests (`DEC-022`, `DEC-027`).

Behavior:
- Passwords are stored only as bcrypt hashes through Spring Security's delegating password encoder (`{bcrypt}` prefix). Plaintext is never stored or returned.
- Duplicate detection relies on the database unique constraint on `app_users.email`. That constraint is case-sensitive, so email uniqueness ignores case only because every write through this API uses the normalized form. Future login must apply the same normalization (`DEC-023`).
- **Registration does not create a session or sign the user in** (`DEC-025`, approved). After a `201`, the client sends the user to the sign-in page; signing in is a separate [AUTH-002](#auth-002--sign-in) request.

**TBD:** Email verification and account recovery.

## AUTH-002 — Sign in

`POST /api/v1/auth/login`

**Implementation status:** Implemented in DIV-006.

**Authentication:** Public.

**CSRF:** Required, as for registration.

Request:
```json
{
  "email": "person@example.com",
  "password": "example-only-not-a-real-password"
}
```

| Field | Rule |
|---|---|
| `email` | Required. Trimmed and lower-cased with `Locale.ROOT` exactly as at registration (`DEC-023`). Must be a valid email address, at most 255 characters. |
| `password` | Required, not blank. Never trimmed. |

Unknown fields are ignored (`DEC-026`).

Response `200 OK`:
```json
{
  "user": {
    "id": "uuid",
    "email": "person@example.com",
    "displayName": "Sample User",
    "onboardingComplete": false
  }
}
```

The response sets the session cookie:

```
Set-Cookie: __Host-DIVIDO_SESSION=<opaque id>; Path=/; Secure; HttpOnly; SameSite=Lax
```

The session ID is never in the body. `displayName` and `onboardingComplete` are read from the database on every sign-in and `/me` call, so they reflect profile changes and onboarding (`DEC-043`, `DEC-044`). The frontend sends a user with `onboardingComplete: false` to `/onboarding`.

On success the server:
- authenticates against the stored `{bcrypt}` hash in `app_users`;
- issues a new session ID, so a session ID that existed before sign-in stops working (session fixation protection);
- clears the pre-login CSRF token (the CSRF cookie is expired in the same response, when the request carried one). Call [AUTH-006](#auth-006--csrf-token) again before the next state-changing request.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A field is missing or invalid. `fieldErrors` is keyed by `email` or `password`. |
| 400 | `MALFORMED_REQUEST` | The body is not readable JSON. |
| 401 | `INVALID_CREDENTIALS` | Unknown email or wrong password. Message: "The email or password is incorrect." Both cases get an identical response, so the response does not reveal whether an account exists. A password longer than 72 UTF-8 bytes cannot match any account and gets the same response. |
| 403 | `CSRF_INVALID` | The CSRF token is missing or does not match the cookie. |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests from the client IP within the configured sliding window (default 10 requests / 1 min). Includes `Retry-After` header. |

A failed sign-in creates no session. Signing in again while signed in replaces the session with a new one.

## AUTH-003 — Current session/user

`GET /api/v1/auth/me`

**Implementation status:** Implemented in DIV-006.

**Authentication:** Required (session cookie).

**CSRF:** Not needed; this is a read-only request.

Response `200 OK`: the same `{ "user": { ... } }` body as sign-in.

The user is taken only from the session. Request parameters, headers and bodies are never used to choose the user.

| Status | Code | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No session cookie, or the session expired, was signed out, or is unknown to the server (for example after a backend restart). Message: "Please sign in to continue." No `WWW-Authenticate` header is sent. |

## AUTH-004 — Sign out

`POST /api/v1/auth/logout`

**Implementation status:** Implemented in DIV-006.

**Authentication:** Required (session cookie).

**CSRF:** Required.

No request body. Response `204 No Content`. The server invalidates the session and expires both cookies with the same attributes they were set with:

```
Set-Cookie: __Host-XSRF-TOKEN=; Expires=<past date>; Path=/; Secure; HttpOnly; SameSite=Lax
Set-Cookie: __Host-DIVIDO_SESSION=; Path=/; Max-Age=0; Expires=<past date>; Secure; HttpOnly; SameSite=Lax
```

The old session ID is rejected afterwards with `401 UNAUTHENTICATED`, even if a client keeps sending it.

| Status | Code | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No valid session (after a valid CSRF token). |
| 403 | `CSRF_INVALID` | The CSRF token is missing or wrong. The session is not affected. |

## AUTH-005 — Recover access

Replaced by [AUTH-007](#auth-007--request-a-password-reset-link) and [AUTH-008](#auth-008--set-a-new-password-with-a-reset-link) (`DEC-045`). The earlier candidate route `POST /api/v1/auth/recovery` is not used.

## AUTH-006 — CSRF token

`GET /api/v1/auth/csrf`

**Implementation status:** Implemented in DIV-006.

**Authentication:** Public. Does not create a session.

Response `200 OK`:
```json
{
  "headerName": "X-XSRF-TOKEN",
  "token": "opaque-token"
}
```

If the request has no CSRF cookie, the response also sets one:

```
Set-Cookie: __Host-XSRF-TOKEN=<raw token>; Path=/; Secure; HttpOnly; SameSite=Lax
```

`token` in the body is **masked**: Spring Security's XOR encoding of the raw token with fresh random bytes, so it is different on every call even though the cookie stays the same. Any of these masked values is valid for the current cookie. The cookie itself is `HttpOnly`; clients cannot and must not read it, and its raw value is not accepted in the header. Responses carry `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`, and the body contains only `headerName` and `token`.

**How CSRF is checked:** every `POST`, `PUT`, `PATCH` and `DELETE` request must carry a masked token in the `X-XSRF-TOKEN` header. The server unmasks it and compares it in constant time with the raw token in the CSRF cookie. The token is read **only from the header**: a `_csrf` form or query parameter is ignored, so a cross-site HTML form cannot supply one, even if an attacker managed to plant the cookie. `GET` requests need no token. A missing, malformed or mismatched token gets:

```json
{
  "status": 403,
  "code": "CSRF_INVALID",
  "message": "Your request could not be verified. Refresh the page and try again."
}
```

The token changes at sign-in and is removed at sign-out.

## AUTH-007 — Request a password reset link

`POST /api/v1/auth/password-reset/request`

**Implementation status:** Implemented in DIV-029 (`DEC-045`).

**Authentication:** Not required. **CSRF:** Required (from AUTH-006).

Request:
```json
{ "email": "person@example.com" }
```

`email` is trimmed and lower-cased; it must be a valid email address of at most 255 characters (`400 VALIDATION_ERROR` otherwise).

Response `202 Accepted`, no body. The response is the same whether or not the email belongs to an account, so it never reveals which emails are registered. When it does:

- **The token:** the server creates a single-use token of 256 random bits and stores only its SHA-256 hash.
- **Older links:** any earlier unused link for the account stops working.
- **The email:** sent in the background, so the response time does not depend on whether the account exists. It contains `{DIVIDO_APP_PUBLIC_URL}/reset-password#token=<token>`, and the link works for 30 minutes. The token is in the URL fragment, which browsers do not send to servers or in `Referer`.

Abuse protection:

| Limit | Scope | Over the limit |
|---|---|---|
| `reset-request`: 5 per minute | Per client IP | `429 RATE_LIMIT_EXCEEDED` with `Retry-After` |
| 3 links per 10 minutes | Per email address | Further requests still get `202`, but no email is sent. |

The token and link are never logged. Locally the email goes to Mailpit (see [environment-setup.md](../09-release-operations/environment-setup.md)). With `DIVIDO_MAIL_ENABLED=false` nothing is sent and a warning without the link is logged.

## AUTH-008 — Set a new password with a reset link

`POST /api/v1/auth/password-reset/confirm`

**Implementation status:** Implemented in DIV-029 (`DEC-045`).

**Authentication:** Not required. **CSRF:** Required.

Request:
```json
{ "token": "<43-character token from the link>", "newPassword": "…" }
```

Response `204 No Content`. On success:

- the new password is stored as a bcrypt hash;
- the token is consumed atomically: of two concurrent uses, exactly one succeeds;
- every other reset token of the account is deleted;
- `credentials_version` is incremented, so **every session of the account ends**, including one in this browser.

The user then signs in again with the new password.

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `newPassword` is missing, shorter than 8 or longer than 72 characters/bytes. |
| 400 | `PASSWORD_RESET_INVALID` | The token is malformed, unknown, expired or already used. One message for all: "This reset link is invalid or has expired. Request a new one." |
| 429 | `RATE_LIMIT_EXCEEDED` | More than 5 confirm attempts per minute from the client IP (`reset-confirm` bucket). |

## Cookies and sessions

| Setting | Value | Configuration |
|---|---|---|
| Session cookie | `__Host-DIVIDO_SESSION`, `Path=/`, `HttpOnly`, `Secure`, no `Domain`, no `Max-Age` (ends when the browser session ends) | `application.yml` and `CookieSettings` |
| CSRF cookie | `__Host-XSRF-TOKEN`, `Path=/`, `HttpOnly`, `Secure`, no `Domain` | `SecurityConfig` |
| `Secure` | On by default, for both cookies | `SESSION_COOKIE_SECURE`. Set `false` only for local HTTP development; the names then become `DIVIDO_SESSION` and `XSRF-TOKEN`, because browsers reject `__Host-` cookies without `Secure`. Every other attribute stays the same. |
| `SameSite` | `Lax` by default, for both cookies | `SESSION_COOKIE_SAME_SITE`; `none` is refused unless `Secure` is on |
| Idle timeout | 30 minutes since the last request | `SESSION_TIMEOUT` (Tomcat rounds to whole minutes) |
| Session store | In memory in the backend process | — |
| CORS | No cross-origin access unless origins are listed | `DIVIDO_CORS_ALLOWED_ORIGINS`: comma-separated exact `http(s)://host[:port]` origins. `null`, wildcards, missing schemes, paths and trailing slashes stop startup. |

The `__Host-` prefix means browsers accept the cookie only with `Secure`, `Path=/` and no `Domain`, so no other subdomain can set or overwrite it. Startup fails if `server.servlet.session.cookie.name` or `server.servlet.session.cookie.domain` is set, if the path is not `/`, or if `SameSite=None` is used without `Secure`.

There is no absolute session lifetime and no limit on concurrent sessions per user yet; an active session can last indefinitely. Sessions are lost when the backend restarts and are not shared between instances. See [Security architecture §10](../04-architecture/security-architecture.md#10-current-implementation).

## Frontend integration

The frontend must never store passwords, session IDs or CSRF tokens in `localStorage` or `sessionStorage`. The session cookie is `HttpOnly` and cannot be read by JavaScript; it does not need to be.

**Every request:** send cookies. Use `credentials: "include"` when the API is on a different origin from the page (for example `http://localhost:3000` calling `http://localhost:8080`), or the default `"same-origin"` when the API is served from the same origin through a proxy. Cross-origin calls also need that origin in `DIVIDO_CORS_ALLOWED_ORIGINS`. For local development over plain HTTP, run the backend with `SESSION_COOKIE_SECURE=false`; the cookie names then lose the `__Host-` prefix, which changes nothing for the frontend.

**Order of calls:**
1. **App start:** `GET /api/v1/auth/me`. `200` means signed in; `401` means show the public pages.
2. **Before a state-changing request** (register, sign in, sign out, and later every `POST`/`PUT`/`PATCH`/`DELETE`): `GET /api/v1/auth/csrf` and keep `token` in memory. Send it in the `X-XSRF-TOKEN` header; never as a form field or query parameter, which the server ignores. Do not try to read the CSRF cookie: it is `HttpOnly`, and its raw value is rejected. Fetch a token again after sign-in, after sign-out, and after any `403 CSRF_INVALID`.
3. **Create account:** `POST /api/v1/auth/register`. On `201`, go to the sign-in page. The user is not signed in.
4. **Sign in:** `POST /api/v1/auth/login`. On `200`, the user is signed in; use the returned `user`. Then fetch a new CSRF token.
5. **Sign out:** `POST /api/v1/auth/logout`. On `204`, clear in-memory user data and go to a public page.
6. **Forgot password:** `/forgot-password` calls AUTH-007 and always shows the same neutral message. `/reset-password` reads `#token=` once, removes it from the address bar and history, calls AUTH-008, then reloads `/sign-in?notice=password-reset`.
7. **After sign-in:** if `user.onboardingComplete` is `false`, go to `/onboarding`, otherwise `/dashboard`.

**Handling errors:**

| Status / code | Meaning | Suggested handling |
|---|---|---|
| `400 VALIDATION_ERROR` | Field problems | Show `fieldErrors` next to the fields. |
| `400 MALFORMED_REQUEST` | The client sent an unreadable body | Treat as a client bug. |
| `401 INVALID_CREDENTIALS` | Sign-in failed | Show the message; do not say which field was wrong. |
| `401 UNAUTHENTICATED` | No valid session on a protected request | The session has ended (expired, signed out, or the server restarted). Clear user state and go to sign in. |
| `403 CSRF_INVALID` | Token missing, wrong or rotated | Fetch a new token and retry once; if it fails again, show the message. |
| `409 REGISTRATION_CONFLICT` | Account could not be created | Show the neutral message; offer sign in. |
| `400 PASSWORD_RESET_INVALID` | Reset link unusable | Show the message and a link to request a new one. |
| `429 RATE_LIMIT_EXCEEDED` | Too many attempts | Show the message; wait for `Retry-After`. |

**How the browser learns the session ended:** the next protected request returns `401 UNAUTHENTICATED`. Nothing is pushed to the client, and there is no "expires at" value; the idle timer restarts on every request.

## Authentication security requirements

- Hash passwords with a maintained password-hashing algorithm through Spring Security-supported mechanisms.
- Do not log credentials, cookies, session IDs, CSRF tokens, or recovery tokens.
- Rate limit login/register/recovery as appropriate before public launch. **Not implemented yet.**
- Protect every non-public endpoint independently of frontend route guards.
- Exact request DTOs and response schemas must be represented in `openapi.yaml` after owner approval.
