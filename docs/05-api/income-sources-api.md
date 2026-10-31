# Income Sources API

**Status:** Implemented (DIV-010)

## INCOME-SOURCE-001 — List income sources

`GET /api/v1/income-sources`

Query parameters:
- `includeInactive=false` (optional, default `false`)

Response `200 OK`:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Salary",
      "active": true
    }
  ]
}
```

Only sources belonging to the authenticated user are returned (`WHERE user_id = :authUserId`).

## INCOME-SOURCE-002 — Create income source

`POST /api/v1/income-sources`

Request:
```json
{
  "name": "Freelance work"
}
```

Response `201 Created`:
```json
{
  "id": "uuid",
  "name": "Freelance work",
  "active": true
}
```

Rules:
- Name is required, trimmed, 1–100 characters.
- Backend derives ownership from session context (`user_id = auth_user.id`).
- Duplicate names for the same user return `409 Conflict`.

## INCOME-SOURCE-003 — Update income source

`PATCH /api/v1/income-sources/{sourceId}`

Request:
```json
{
  "name": "Contract work"
}
```

Response `200 OK`: updated source representation.

Rules:
- Only the owning user can update their income source.
- Request targeting another user's income source returns `404 Not Found` (safe isolation).
- Duplicate names return `409 Conflict`.

## INCOME-SOURCE-004 — Deactivate income source

`POST /api/v1/income-sources/{sourceId}/deactivate`

Response: `204 No Content`.

Rules:
- Sets `is_active = false`.
- Only the owning user can deactivate their income source.
- Request targeting another user's income source returns `404 Not Found`.

## Security and ownership

- Every operation requires an authenticated session (`DEC-015`, `DEC-027`).
- State-changing requests require CSRF token in `X-XSRF-TOKEN` header.
- Users cannot access, view, update, or deactivate another user's income sources.
- Income sources are optional on income transactions per `DEC-003`; if provided on a transaction, backend verifies user ownership.
