# Categories API

**Status:** Proposed contract — exact default-category model is TBD

## CATEGORY-001 — List usable categories

`GET /api/v1/categories`

Query parameters (proposed):
- `includeInactive=false`
- `group=NEEDS|WANTS|CULTURE|UNEXPECTED` (optional)

Response `200 OK`:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Groceries",
      "group": "NEEDS",
      "isDefault": true,
      "active": true
    }
  ]
}
```

Only categories available to the current user are returned. Whether global defaults are shared or copied per user is a schema decision.

## CATEGORY-002 — Create custom category

`POST /api/v1/categories`

Request:
```json
{
  "name": "Pet care",
  "group": "NEEDS"
}
```

Response `201 Created`: category representation.

Rules:
- Category group must be an approved enum value.
- Name validation, case/whitespace normalization, and uniqueness scope must be defined.
- Client-supplied `userId`, `isDefault`, and privileged fields are ignored/rejected; backend assigns ownership/default status.

## CATEGORY-003 — Update category

`PATCH /api/v1/categories/{categoryId}`

Request (partial):
```json
{
  "name": "Pet supplies",
  "group": "NEEDS"
}
```

Only fields allowed by the approved lifecycle policy may be updated. Changing a group mapping after transactions exist can alter historical reports; do not permit this until historical behavior is decided.

## CATEGORY-004 — Deactivate category

`POST /api/v1/categories/{categoryId}/deactivate`

Response: proposed `200 OK` with category or `204 No Content`.

Deactivation should prevent new use but preserve historical references. Whether this endpoint is in MVP is TBD.

## Security and errors

- User-owned categories are scoped to the current session user.
- A user cannot edit/deactivate another user's category.
- Default-category mutation policy must be explicit.
- Duplicate names return the documented `409` or field validation response.
- Do not hard-delete a category referenced by historical transactions without an approved migration/lifecycle rule.
