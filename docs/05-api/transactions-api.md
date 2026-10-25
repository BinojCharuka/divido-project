# Transactions API

**Status:** Proposed contract — core MVP contract; exact schema needs owner approval

## Transaction model proposal

One resource represents one recorded money event. `type` distinguishes `INCOME` and `EXPENSE`; amount is transmitted as a decimal string. This is a proposed design, not a final schema decision.

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

Expense request (proposed):
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

Income request (proposed):
```json
{
  "type": "INCOME",
  "amount": "85000.00",
  "date": "2026-10-01",
  "incomeSourceId": "uuid",
  "description": "Monthly salary"
}
```

Response `201 Created`: created transaction representation.

Rules:
- Required fields, amount precision/range, allowed date range, description length, payment-method enum, and income-source requirements must be approved.
- Expense category must be active and usable by current user.
- Income source must be usable by current user if required.
- Ignore/reject client-supplied `userId`, calculated totals, group override, and server-managed timestamps.
- Duplicate submission/idempotency behavior must be decided.

## TX-003 — Read transaction

`GET /api/v1/transactions/{transactionId}`

Returns an owned active record; missing, deleted, or another user's record follows the safe 404/403 policy.

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
- Decide whether changing `type` is permitted; proposed default is to disallow type changes and require correction workflow if necessary.
- Recompute summaries from persisted data; do not trust client-calculated totals.

## TX-005 — Soft-delete transaction

`DELETE /api/v1/transactions/{transactionId}`

Proposed response: `204 No Content`.

This means mark as deleted, not physically erase immediately, if soft-delete is approved. Normal lists and calculations exclude deleted records.

## TX-006 — Restore transaction (optional)

`POST /api/v1/transactions/{transactionId}/restore`

Proposed response `200 OK` with restored transaction.

Do not implement until restore UI, retention, and lifecycle behavior are approved.

## Shared requirements

- Every operation requires authentication except any deliberately public endpoint (none proposed here).
- Query results are scoped to current user.
- Pagination limits response size.
- Date filters are inclusive date-only values in the approved timezone policy.
- Errors use the common error schema.
- Every endpoint needs tests for validation and cross-user isolation.
