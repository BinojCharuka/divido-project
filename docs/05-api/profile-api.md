# Profile and Account API

**Status:** Implemented (DIV-022, DIV-023, DIV-035) — `main` via PR #31 (squash commit `5746118`, 2026-11-18), following `DEC-043`, `DEC-044` and `DEC-046` (APPROVED). The contract is not frozen.

All endpoints:

- need a signed-in session (`401 UNAUTHENTICATED` otherwise);
- act only on the session's own account. The user ID is never taken from the request.

State-changing requests also need the CSRF token from [AUTH-006](authentication-api.md#auth-006--csrf-token) in `X-XSRF-TOKEN`; without it they get `403 CSRF_INVALID`.

Validation errors use the usual envelope (`400 VALIDATION_ERROR`, "Please correct the highlighted fields.", with `fieldErrors`). See [api-conventions.md](api-conventions.md).

## Profile representation

```json
{
  "id": "6f0c1d2e-0000-4000-8000-000000000001",
  "email": "sample.user@example.com",
  "displayName": "Sample User",
  "currency": "LKR",
  "timeZone": "Asia/Colombo",
  "locale": "en",
  "onboardingComplete": true
}
```

- Only `displayName` can change (`DEC-043`).
- `currency`, `timeZone` and `locale` are fixed for the MVP and returned for display only.
- `email` cannot be changed.

## PROFILE-001 — Read profile

`GET /api/v1/profile` returns `200 OK` with the profile.

## PROFILE-002 — Update display name

`PATCH /api/v1/profile` with the body:

```json
{ "displayName": "Sample User" }
```

Returns `200 OK` with the updated profile.

`displayName` is trimmed. It is required, at most 100 characters, and cannot contain NUL. Any other field in the body is ignored; nothing else is writable.

## PROFILE-003 — Complete onboarding

`POST /api/v1/profile/onboarding-complete` takes no body. It returns `200 OK` with the profile, where `onboardingComplete` is `true`.

- **Rule (`DEC-044`):** finishing or skipping onboarding both call this. The first call records the time. Later calls change nothing and still return `200`.
- **Accounts at V7:** accounts that existed when V7 was applied are already complete.
- **New accounts:** a newly registered account starts incomplete.

## PROFILE-004 — Change password

`POST /api/v1/profile/password` with the body:

```json
{ "currentPassword": "…", "newPassword": "…" }
```

Returns `204 No Content`.

**Password rules:**

- `newPassword` must be 8–72 characters and at most 72 UTF-8 bytes.
- `currentPassword` must be correct. Otherwise: `400 VALIDATION_ERROR`, with `fieldErrors.currentPassword` "The current password is incorrect."
- `newPassword` must differ from the current one. Otherwise: `fieldErrors.newPassword` "Choose a password different from your current one."

**Sessions after a change (`DEC-043`):**

- **This session:** stays signed in under a new session ID.
- **Other sessions:** every other session of the account ends on its next request with `401`. This works through `app_users.credentials_version`.
- **CSRF:** the client fetches a new CSRF token before its next state-changing request.

**Rate limit:** shares the `password-check` limit with PROFILE-005, 10 requests per minute per client. Over the limit: `429 RATE_LIMIT_EXCEEDED` with `Retry-After`.

## PROFILE-005 — Delete account

`DELETE /api/v1/profile` with the body:

```json
{ "password": "…", "confirmation": "DELETE" }
```

Returns `204 No Content`, and the session is signed out with its cookies expired.

**Checks:**

- `confirmation` must be exactly `DELETE` after trimming. Otherwise: `fieldErrors.confirmation` "Type DELETE to confirm."
- `password` must be correct. Otherwise: `fieldErrors.password` "The password is incorrect."

**What is deleted (`DEC-046`):** the account and everything it owns, in one transaction:

- transactions;
- budgets;
- reflections and their answers;
- custom categories;
- income sources;
- reset tokens;
- any legacy production rows tied to the user.

Backups age out under their retention period; see [data-retention.md](../06-data/data-retention.md).

**Rate limit:** the same `password-check` limit as PROFILE-004.

## Frontend use

| Call | Where in the app |
|---|---|
| PROFILE-002 | Settings → Account → Display name |
| PROFILE-004 | Settings → Change password |
| PROFILE-005 | Settings → Delete account. A dialog asks for the password and the word DELETE. |
| PROFILE-003 | The `/onboarding` stepper |

The `user` object from [AUTH-002/AUTH-003](authentication-api.md) carries `displayName` and `onboardingComplete`. The app uses `onboardingComplete` to send new accounts to `/onboarding` after sign-in.
