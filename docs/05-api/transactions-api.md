# Transactions API

**Status:** Contract updated per owner-approved decisions DEC-003, DEC-013, and DEC-014 (DIV-009A)

## Transaction model

One resource represents one recorded money event. `type` distinguishes `INCOME` and `EXPENSE`; amount is transmitted as a decimal string.

- **DEC-003 (Approved):** Income source is optional for `INCOME` transactions. Creation succeeds without `incomeSourceId`. If provided, backend validates ownership by the authenticated user.
- **DEC-013 (Approved):** Category ownership: exactly 3 shared global default categories (`user_id IS NULL`) plus user-owned custom categories (`user_id = auth_user.id`). An `EXPENSE` transaction requires a category usable by the authenticated user (global default or own custom).
- **DEC-014 (Approved):** MVP uses hard delete. Successful deletion returns HTTP `204 No Content` and permanently removes the transaction. Deleted records cannot be retrieved. Soft-delete and restore (`TX-006`) are removed from MVP.

## TX-001 — List transactions

`GET /api/v1/transactions`

Query parameters (proposed):
- `page=0`
- `size=20`
- `type=INCOME|EXPENSE` (optional)
- `from=YYYY-MM-DD` (optional, inclusive)
- `to=YYYY-MM-DD` (optional, inclusive)
- `categoryId` (optional)
- `incomeSourceId` (optional)
- `sort=date,desc` (allowlisted; final syntax TBD)

Response `200 OK`:
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "EXPENSE",
      "amount": "2400.00",
      "date": "2026-10-12",
      "category": {
        "id": "uuid",
        "name": "Groceries",
        "group": "NEEDS"
      },
      "incomeSource": null,
      "description": "Weekly groceries",
      "paymentMethod": null,
      "createdAt": "2026-10-12T08:30:00Z",
      "updatedAt": "2026-10-12T08:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## TX-002 — Create transaction

`POST /api/v1/transactions`

Expense request:
```json
{
  "type": "EXPENSE",
  "amount": "2400.00",
  "date": "2026-10-12",
  "categoryId": "uuid",
  "description": "Weekly groceries",
  "paymentMethod": "CASH"
}
```

Income request (with optional income source):
```json
{
  "type": "INCOME",
  "amount": "85000.00",
  "date": "2026-10-01",
  "incomeSourceId": "uuid",
  "description": "Monthly salary"
}
```

Income request (without income source — DEC-003):
```json
{
  "type": "INCOME",
  "amount": "5000.00",
  "date": "2026-10-05",
  "description": "Cash gift"
}
```

Response `201 Created`: created transaction representation.

Rules:
- Required fields for `EXPENSE`: `type`, `amount`, `date`, `categoryId`.
- Required fields for `INCOME`: `type`, `amount`, `date`. `incomeSourceId` is OPTIONAL (DEC-003).
- Expense `categoryId` must reference an active category accessible to the authenticated user (either a global default where `user_id IS NULL`, or the user's own custom category where `user_id = auth_user.id`) (DEC-013).
- If `incomeSourceId` is provided on `INCOME`, backend must verify that the income source belongs to the authenticated user (DEC-003).
- Ignore/reject client-supplied `userId`, calculated totals, group override, and server-managed timestamps.
- Decimal amount precision: 2 decimal places (scale 2); positive amount only.

## TX-003 — Read transaction

`GET /api/v1/transactions/{transactionId}`

Returns an owned active record; missing or another user's record follows the safe 404/403 policy.

## TX-004 — Update transaction

`PATCH /api/v1/transactions/{transactionId}`

Partial update example:
```json
{
  "amount": "2500.00",
  "date": "2026-10-12",
  "categoryId": "uuid",
  "description": "Updated description"
}
```

Rules:
- Backend revalidates all changed fields and resource ownership.
- If `categoryId` is changed on an expense, backend verifies category accessibility (DEC-013).
- If `incomeSourceId` is changed on income, backend verifies income source ownership (DEC-003).
- Changing `type` is not supported on update (type is immutable; use delete + create instead).
- Field presence matters (implemented in DIV-013): an omitted field is left unchanged; an explicit `null` clears an optional field (`description`, `paymentMethod`, and `incomeSourceId` on income). `amount`, `date` and an expense's `categoryId` cannot be cleared. Clients must send `null`, not omit the key, when a user empties an optional field.
- Recompute summaries from persisted data; do not trust client-calculated totals.

## TX-005 — Delete transaction (Hard delete per DEC-014)

`DELETE /api/v1/transactions/{transactionId}`

Response: `204 No Content`.

Rules:
- Hard delete: permanently deletes the transaction record from the database (DEC-014).
- Successful deletion returns HTTP `204 No Content`.
- The deleted transaction is permanently erased and can no longer be retrieved by subsequent `GET` requests.
- Users can only delete their own transactions; requests targeting another user's transaction must be rejected (404/403).

## TX-006 — Restore transaction (DEFERRED / OUT OF MVP)

*Removed from MVP per DEC-014.* Because the MVP uses hard delete, restoration of deleted transactions is not supported and will not be implemented.

## TX-007 — Clear all transactions (Permanent wipe per user)

`DELETE /api/v1/transactions`

Response: `204 No Content`.

Rules:
- Hard delete: permanently deletes all transaction records belonging to the authenticated user from the database.
- Multi-tenant isolation: strictly deletes records where `user_id = current_user_id`. Never affects or deletes other users' transactions.
- Successful deletion returns HTTP `204 No Content` with an empty body.
- The user's transaction history, dashboard totals, and monthly aggregates immediately reflect 0 transactions.

## Shared requirements

- Every operation requires authentication (`DEC-015`, `DEC-027`).
- All queries and mutations are strictly scoped to the authenticated user session.
- Users cannot read, update, or delete another user's transactions.
- Pagination limits response size.
- Date filters are inclusive date-only values in the user's timezone.
- Errors use the common error schema.
- Every endpoint requires automated integration tests verifying validation, business rules, and cross-user isolation.
