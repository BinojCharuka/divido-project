# Monthly Reflection API

**Status:** IMPLEMENTED (DIV-028) — contract approved 2026-11-16 (`DEC-030`, `DEC-034` to `DEC-040`)
**Code:** `ReflectionController`, `ReflectionService`, `ReflectionQuestions`, `ReflectionRepository` (backend); `lib/api/reflections.ts`, `features/reflection/` (frontend)
**Schema:** `reflections`, `reflection_answers`, Flyway `V6__reflections.sql`

## Model

One reflection per user and calendar month, holding answers to the approved questions. The owner is always the signed-in user; no request field or parameter names a user. Unknown top-level fields (for example `userId`) are ignored (`DEC-026`).

Question set version 1 (DEC-034), all optional; the wording lives in the frontend:

| `questionId` | Question |
|---|---|
| `what-went-well` | What went well with your money this month? |
| `what-felt-difficult` | What felt difficult or surprising? |
| `what-to-change` | What would you like to change next month? |

`month` (path) is `YYYY-MM`, year 1000–9999; otherwise `400 VALIDATION_ERROR` with `fieldErrors.month`.

## REFLECTION-001 — Read a month's reflection

`GET /api/v1/reflections/{month}` — authentication required.

`200 OK`:
```json
{
  "month": "2026-10",
  "questionSetVersion": 1,
  "version": 2,
  "answers": [
    { "questionId": "what-went-well", "answer": "Planned groceries before the week." },
    { "questionId": "what-to-change", "answer": "Review small purchases weekly." }
  ],
  "createdAt": "2026-10-30T10:00:00Z",
  "updatedAt": "2026-10-31T09:12:00Z"
}
```

`answers` contains only answered questions, in question order. `404 REFLECTION_NOT_FOUND` when nothing is saved for the month; another user's reflection for the same month also yields `404`.

## REFLECTION-002 — Create or edit a month's reflection

`PUT /api/v1/reflections/{month}` — authentication and `X-XSRF-TOKEN` required.

Request:
```json
{
  "version": 2,
  "answers": [
    { "questionId": "what-went-well", "answer": "Planned groceries before the week." },
    { "questionId": "what-felt-difficult", "answer": "" },
    { "questionId": "what-to-change", "answer": "Review small purchases weekly." }
  ]
}
```

- **First save:** omit `version`. If a reflection already exists for the month → `409 REFLECTION_CONFLICT`.
- **Edit:** send the `version` last read. The save replaces the whole answer set and returns `version + 1`. If the stored version differs, or the reflection was deleted meanwhile → `409 REFLECTION_CONFLICT`, and nothing changes (DEC-039). Two simultaneous first saves, or two edits from the same version, let exactly one succeed.
- Response: `200 OK` with the stored reflection (same body as REFLECTION-001).

Validation (DEC-035, DEC-040), all `400 VALIDATION_ERROR`:

| Rule | Field key |
|---|---|
| Body or `answers` missing | `answers` |
| More than 3 items, an unknown or missing `questionId`, a null item, or a question answered twice | `answers` |
| An answer over 2,000 characters after trimming, counted in Unicode code points | `answers.<questionId>` |
| Every answer blank (blank answers are dropped, never stored) | `answers` |
| `version` below 1 | `version` |
| A month after the current month (user timezone, default `Asia/Colombo`); the current month is allowed | `month` |

Answers are stored with leading and trailing whitespace removed. Error messages never include answer text.

Other errors: `400 MALFORMED_REQUEST`, `401 UNAUTHENTICATED`, `403 CSRF_INVALID`.

## REFLECTION-003 — List reflections

`GET /api/v1/reflections` — authentication required.

`200 OK`, newest month first, without answer text (DEC-038):
```json
{ "items": [ { "month": "2026-11", "answeredCount": 2, "updatedAt": "2026-11-16T06:00:00Z" } ] }
```

## REFLECTION-004 — Delete a month's reflection

`DELETE /api/v1/reflections/{month}` — authentication and `X-XSRF-TOKEN` required.

`204 No Content`. The reflection and its answers are deleted permanently (DEC-038). `404 REFLECTION_NOT_FOUND` when nothing is saved for the month (including another user's).

## Lifecycle and privacy (DEC-038)

- Editable at any time; no month is locked.
- No drafts on the server or in the browser. The UI warns before leaving with unsaved text.
- Kept until the user deletes it or the account is removed (`ON DELETE CASCADE` from `app_users`). Backups may keep content until their own expiry (DIV-033, DIV-035).
- Answer text is never logged, never analysed and never returned by the list.
- The legacy production table `monthly_reflections` (one row) is untouched and not read (DEC-036).

## Tests

- `backend/src/test/java/com/divido/controller/ReflectionIntegrationTest.java` (Testcontainers; authentication, CSRF, isolation, owner from session, create/read/edit/delete, stale and duplicate saves, concurrency, history without text, cascade on account removal, every validation rule, database constraints)
- `backend/src/test/java/com/divido/migration/LegacyProductionHistoryMigrationTest.java` (V6 on the production-like legacy history)
- `frontend/tests/reflection.test.tsx`
