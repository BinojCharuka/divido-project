# Income Sources API

**Status:** Proposed contract

## INCOME-SOURCE-001 — List income sources

`GET /api/v1/income-sources`

Proposed response:
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

Only sources available to the authenticated user are returned.

## INCOME-SOURCE-002 — Create income source

`POST /api/v1/income-sources`

Request:
```json
{
  "name": "Freelance work"
}
```

Response `201 Created`: source representation.

## INCOME-SOURCE-003 — Update income source

`PATCH /api/v1/income-sources/{sourceId}`

Request:
```json
{
  "name": "Contract work"
}
```

Only approved editable fields may be changed.

## INCOME-SOURCE-004 — Deactivate income source

`POST /api/v1/income-sources/{sourceId}/deactivate`

Proposed response: `200 OK` or `204 No Content`; finalize one.

## Rules and open decisions

- Backend derives ownership from session.
- Name validation and duplicate policy are TBD.
- Source requirement on income entries must be approved.
- Deactivation must not corrupt historical income records.
- Decide whether an inactive source can still be selected while editing a historical entry.
- Decide whether predefined income sources exist or users create all sources.
