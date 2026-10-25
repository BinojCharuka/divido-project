# Budgets and Monthly Plan API

**Status:** Proposed contract

## Budget model proposal

One monthly plan per user and calendar month, containing planned income, savings target, and four allocations: `NEEDS`, `WANTS`, `CULTURE`, `UNEXPECTED`.

## BUDGET-001 — Read monthly plan

`GET /api/v1/budgets/{month}`

`month` format: `YYYY-MM`.

Response `200 OK`:
```json
{
  "month": "2026-10",
  "plannedIncome": "100000.00",
  "savingsTarget": "15000.00",
  "allocations": {
    "NEEDS": "40000.00",
    "WANTS": "20000.00",
    "CULTURE": "10000.00",
    "UNEXPECTED": "5000.00"
  },
  "allocationTotal": "75000.00",
  "plannedTotal": "90000.00",
  "overAllocationAmount": "0.00"
}
```

All monetary fields are decimal strings under the proposed convention.

## BUDGET-002 — Create or update monthly plan

`PUT /api/v1/budgets/{month}`

Request:
```json
{
  "plannedIncome": "100000.00",
  "savingsTarget": "15000.00",
  "allocations": {
    "NEEDS": "40000.00",
    "WANTS": "20000.00",
    "CULTURE": "10000.00",
    "UNEXPECTED": "5000.00"
  }
}
```

Proposed response: `200 OK` with stored plan. If newly created, `201 Created` is also possible; choose one consistent upsert behavior.

Rules:
- Only the current user's plan for that month can be read/changed.
- Validate all monetary fields and require exactly the approved group set.
- Proposed over-allocation formula: `sum(allocations) + savingsTarget - plannedIncome`. Positive result means over-allocated.
- Whether over-allocation blocks saving is TBD.
- Clarify whether planned income is mandatory, can be zero, and whether omitted allocations default to zero.

## BUDGET-003 — Read budget versus actual

Candidate route: `GET /api/v1/budgets/{month}/summary`

May return planned group allocation, eligible recorded expense, and remaining/over-budget amount for each group. This may instead be incorporated into Dashboard API; choose one authoritative source to avoid duplicated calculation logic.

## Open decisions

- Upsert status code.
- Missing plan response: `404` versus a `200` empty/default object.
- Over-allocation behavior.
- Missing/zero allocation semantics.
- Summary location (Budget API or Dashboard API).
- Concurrency/version control if two requests update the same month.
