# Monthly Reflection API

**Status:** Proposed contract — MVP inclusion and content require approval

## REFLECTION-001 — Read reflection for a month

`GET /api/v1/reflections/{month}`

`month` format: `YYYY-MM`.

Proposed response:
```json
{
  "month": "2026-10",
  "answers": [
    {
      "questionId": "what-went-well",
      "answer": "Example answer"
    }
  ],
  "updatedAt": "2026-10-25T10:15:30Z"
}
```

## REFLECTION-002 — Create/update reflection

`PUT /api/v1/reflections/{month}`

Request:
```json
{
  "answers": [
    {
      "questionId": "what-went-well",
      "answer": "I planned my spending before the week began."
    },
    {
      "questionId": "what-to-change",
      "answer": "Review small purchases weekly."
    }
  ]
}
```

Proposed response: `200 OK` with saved reflection.

## Rules

- Reflection is associated with the authenticated user and one calendar month.
- Answers are optional unless final question design says otherwise.
- Only approved question IDs are accepted; do not trust arbitrary client-supplied question metadata.
- Define maximum answer length and retention policy before implementation.
- Avoid logging reflection content.
- Users can only read/update their own reflections.
- If reflection is not approved for MVP, do not implement these routes yet.

## Open decisions

- Whether reflections are in MVP.
- Exact question IDs/text and question versioning.
- Maximum answer length.
- Draft persistence and editability.
- Missing reflection behavior (`404` vs empty response).
- Retention/export/deletion policy.
