# Budgets and Monthly Plan API

**Status:** IMPLEMENTED (DIV-025) — contract approved in DIV-017 (`DEC-028`, `DEC-012`), 2026-11-04
**Code:** `BudgetController`, `BudgetService`, `BudgetCalculator`, `BudgetMonth` (backend); `lib/api/budgets.ts`, `features/budget/BudgetPlanner.tsx` (frontend)
**Schema:** `monthly_budgets`, Flyway `V4__monthly_budgets.sql`

## Model

One monthly plan per user and calendar month: planned income, a savings target, and four group allocations `NEEDS`, `WANTS`, `CULTURE`, `UNEXPECTED`. The owner is always the signed-in user; no request field or parameter names a user.

## Calculation rules (DEC-028)

All formulas live in `BudgetCalculator` and are shared with the Dashboard API.

| Figure | Formula | Notes |
|---|---|---|
| `allocationTotal` | `NEEDS + WANTS + CULTURE + UNEXPECTED` | Exact; scale 2 |
| `plannedTotal` | `savingsTarget + allocationTotal` | Exact; scale 2 |
| `overAllocationAmount` | `plannedTotal − plannedIncome` | Signed. Positive = plan exceeds planned income; `0.00` = exactly planned; negative = part of planned income not yet planned |
| `overAllocated` | `overAllocationAmount > 0` | Warning only: saving is **never** blocked (`DEC-012`) |

Planned values are planning figures only (BR-007): they are never mixed with recorded income or expenses, and the savings target does not imply any balance or transfer (BR-008, BR-009).

## Validation (DEC-028)

- `month` (path): `YYYY-MM`, year 1000–9999, month 01–12; otherwise `400 VALIDATION_ERROR` with `fieldErrors.month`.
- `plannedIncome`, `savingsTarget` and all four allocations are **required** decimal strings. Zero is allowed; negative values, more than 2 decimal places, non-numeric text and values above `9999999999.99` are rejected. Omitted allocations are an error, never defaulted to zero.
- `allocations` must contain only the four group keys (upper case). Any other key → `fieldErrors.allocations`.
- Errors are reported per field in one response, with keys `plannedIncome`, `savingsTarget`, `allocations`, `allocations.NEEDS`, `allocations.WANTS`, `allocations.CULTURE`, `allocations.UNEXPECTED`.
- Unknown top-level fields (for example `userId`) are ignored (`DEC-026`).
- The database repeats the rules: `NUMERIC(12,2)` columns, `CHECK (… >= 0)` on each amount, `CHECK` that `budget_month` is the first day of a month, `UNIQUE (user_id, budget_month)`, `ON DELETE CASCADE` from `app_users`.

## BUDGET-001 — Read monthly plan

`GET /api/v1/budgets/{month}` — authentication required.

`200 OK`:
```json
{
  "month": "2026-10",
  "plannedIncome": "100000.00",
  "savingsTarget": "15000.00",
  "allocations": { "NEEDS": "40000.00", "WANTS": "20000.00", "CULTURE": "10000.00", "UNEXPECTED": "5000.00" },
  "allocationTotal": "75000.00",
  "plannedTotal": "90000.00",
  "overAllocationAmount": "-10000.00",
  "overAllocated": false,
  "createdAt": "2026-10-01T04:00:00Z",
  "updatedAt": "2026-10-01T04:00:00Z"
}
```

`404 BUDGET_NOT_FOUND` when the signed-in user has no plan for that month. Another user's plan for the same month is never visible: it also yields `404`.

## BUDGET-002 — Create or replace monthly plan

`PUT /api/v1/budgets/{month}` — authentication and `X-XSRF-TOKEN` required.

Request:
```json
{
  "plannedIncome": "100000.00",
  "savingsTarget": "15000.00",
  "allocations": { "NEEDS": "40000.00", "WANTS": "20000.00", "CULTURE": "10000.00", "UNEXPECTED": "5000.00" }
}
```

Response: always `200 OK` with the stored plan (same body as BUDGET-001), whether the plan was created or replaced.

Concurrency: the write is a single `INSERT … ON CONFLICT (user_id, budget_month) DO UPDATE`. Concurrent saves for the same month never create duplicates or constraint errors; the last write wins. There is no version/ETag check in the MVP.

Errors: `400 VALIDATION_ERROR`, `400 MALFORMED_REQUEST`, `401 UNAUTHENTICATED`, `403 CSRF_INVALID`.

## Budget versus actual

There is no `/budgets/{month}/summary` endpoint. Budget-versus-actual figures are provided only by the [Dashboard API](dashboard-api.md) so there is one authoritative source.

## Tests

- `backend/src/test/java/com/divido/service/BudgetCalculatorTest.java`, `BudgetMonthTest.java` (unit)
- `backend/src/test/java/com/divido/controller/BudgetIntegrationTest.java` (Testcontainers: CRUD, validation, precision boundaries, DB constraints, isolation, CSRF, concurrency)
- `frontend/tests/budget-plan.test.ts`, `frontend/tests/budget.test.tsx`, `frontend/e2e/budget-dashboard.spec.ts`
