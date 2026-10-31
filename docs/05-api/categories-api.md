# Categories API

**Status:** Implemented (DIV-010)

## Category ownership model (DEC-013)

- **Global default categories:** Divido has exactly 3 shared global default categories stored with `user_id IS NULL`, seeded in `V2__categories_and_income_sources.sql`:
  1. `Groceries` (Group: `NEEDS` in API / `NEED` in DB constraint, slug: `groceries`)
  2. `Transport` (Group: `NEEDS` in API / `NEED` in DB constraint, slug: `transport`)
  3. `Entertainment` (Group: `WANTS` in API / `WANT` in DB constraint, slug: `entertainment`)
- **Custom categories:** Users can create custom categories. Custom categories belong strictly to their creator (`user_id = auth_user.id`).
- **Usable categories:** An authenticated user can list and use all global default categories plus their own custom categories (`user_id IS NULL OR user_id = :authUserId`).
- **Immutability of defaults:** Users cannot modify or delete global default categories (attempts return `403 Forbidden`).
- **Isolation of custom categories:** Users cannot access, view, modify, or delete another user's custom categories (attempts return safe `404 Not Found`).
- **Slug generation:** Slugs are generated server-side in lowercase kebab-case. Duplicate slug candidates are automatically disambiguated with a numerical suffix (`-2`, `-3`). Duplicate category names for the same user return `409 Conflict`.

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

Returns all 3 global default categories (`isDefault: true`, `user_id IS NULL`) plus the authenticated user's active custom categories (`isDefault: false`, `user_id = auth_user.id`).

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
- Category group must be an approved enum value (`NEEDS`, `WANTS`, `CULTURE`, `UNEXPECTED`).
- Backend assigns `user_id = auth_user.id` and generates `slug`.
- Client-supplied `userId`, `isDefault`, and privileged fields are ignored/rejected; user cannot create a global default.
- Name validation, case/whitespace normalization, and user-scoped uniqueness rules apply.

## CATEGORY-003 — Update category

`PATCH /api/v1/categories/{categoryId}`

Request (partial):
```json
{
  "name": "Pet supplies",
  "group": "NEEDS"
}
```

Rules:
- Global default categories cannot be modified by users (DEC-013); mutation attempt returns `403 Forbidden` / `404 Not Found`.
- Only the owning user can update their custom category.
- Changing a group mapping after transactions exist can alter historical reports; do not permit this until historical behavior is decided.

## CATEGORY-004 — Deactivate category

`POST /api/v1/categories/{categoryId}/deactivate`

Response: proposed `200 OK` with category or `204 No Content`.

Rules:
- Global default categories cannot be deactivated by users (DEC-013).
- Deactivation should prevent new use in transactions but preserve historical transaction references. Whether this endpoint is in MVP is TBD.

## Security and errors

- User-owned categories are strictly scoped to the authenticated session user.
- Global categories cannot be modified or deleted by users.
- A user cannot access, edit, or deactivate another user's category (404/403).
- Duplicate names return the documented `409` or field validation response.
- Do not hard-delete a category referenced by historical transactions without an approved migration/lifecycle rule.
