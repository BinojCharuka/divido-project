# Profile and Preferences API

**Status:** Proposed contract

## PROFILE-001 — Read current profile

`GET /api/v1/profile`

**Authentication:** Required

Proposed response:
```json
{
  "id": "uuid",
  "displayName": "Sample User",
  "locale": "en",
  "currency": "LKR",
  "timeZone": "Asia/Colombo",
  "onboardingComplete": false
}
```

The exact fields are TBD; do not create a display-name requirement unless approved.

## PROFILE-002 — Update profile/preferences

`PATCH /api/v1/profile`

**Authentication:** Required  
**CSRF:** Required.

Proposed request:
```json
{
  "displayName": "Sample User",
  "locale": "en",
  "currency": "LKR",
  "timeZone": "Asia/Colombo"
}
```

Response `200 OK`: updated profile representation.

Rules:
- Only explicitly editable fields may be changed.
- User ID and authorization attributes are never writable from this endpoint.
- Supported locale/currency/timezone values must be allowlisted.
- If currency/timezone changes are supported, their effect on historical transactions and month calculations must be documented first.

## PROFILE-003 — Complete onboarding

Candidate route: `POST /api/v1/profile/onboarding-complete`

This route is optional and must not be added if onboarding completion is derived from saved required setup data. Decide one approach and keep it consistent.

Proposed response: updated profile or `204 No Content`.

## Open decisions

- Profile fields and which are required.
- Whether locale/currency/timezone can be changed.
- Whether onboarding status is stored or derived.
- Whether profile updates need optimistic locking/version fields.
