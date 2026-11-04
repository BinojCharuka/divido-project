# Dashboard API

**Status:** IMPLEMENTED (DIV-026) — contract approved in DIV-017 (`DEC-028`), 2026-11-04
**Code:** `DashboardController`, `DashboardService`, `TransactionRepository.aggregateByTypeAndGroup` (backend); `lib/api/dashboard.ts`, `features/dashboard/DashboardView.tsx` (frontend)

## DASH-001 — Read monthly dashboard

`GET /api/v1/dashboard?month=YYYY-MM` — authentication required.

`month` is optional; when omitted the server uses the current calendar month in the user's stored timezone (`app_users.timezone`, default `Asia/Colombo`). The response always states the month used. An invalid `month` → `400 VALIDATION_ERROR` (`fieldErrors.month`).

`200 OK` (synthetic example — the reference reconciliation fixture):
```json
{
  "month": "2026-10",
  "periodStart": "2026-10-01",
  "periodEnd": "2026-10-31",
  "hasBudget": true,
  "plannedIncome": "100000.00",
  "savingsTarget": "15000.00",
  "allocationTotal": "75000.00",
  "plannedTotal": "90000.00",
  "overAllocationAmount": "-10000.00",
  "overAllocated": false,
  "recordedIncome": "85000.00",
  "incomeTransactionCount": 2,
  "totalSpent": "35000.00",
  "expenseTransactionCount": 7,
  "groups": [
    { "group": "NEEDS", "budget": "40000.00", "spent": "22000.00", "remaining": "18000.00", "percentUsed": "55.0", "overBudget": false, "expenseCount": 3 },
    { "group": "WANTS", "budget": "20000.00", "spent": "9000.00", "remaining": "11000.00", "percentUsed": "45.0", "overBudget": false, "expenseCount": 2 },
    { "group": "CULTURE", "budget": "10000.00", "spent": "3000.00", "remaining": "7000.00", "percentUsed": "30.0", "overBudget": false, "expenseCount": 1 },
    { "group": "UNEXPECTED", "budget": "5000.00", "spent": "1000.00", "remaining": "4000.00", "percentUsed": "20.0", "overBudget": false, "expenseCount": 1 }
  ]
}
```

`groups` always has the four groups in the order `NEEDS, WANTS, CULTURE, UNEXPECTED`.

## Rules (DEC-028)

- **Planned** fields (`plannedIncome`, `savingsTarget`, `allocationTotal`, `plannedTotal`, `overAllocationAmount`, `overAllocated`, group `budget`) come from the month's budget, using the same `BudgetCalculator` as the Budget API.
- **Missing plan:** `hasBudget: false`; every planned field, group `budget`, `remaining`, `percentUsed` and `overBudget` is `null`. Recorded figures are still real. No zero is fabricated for a plan that does not exist.
- **Month membership:** a transaction belongs to the month of its stored date-only `transaction_date` (`periodStart ≤ date ≤ periodEnd`, inclusive). No timezone conversion is applied to transaction dates.
- `recordedIncome` = sum of the user's `INCOME` transactions in the month; `"0.00"` when none (`incomeTransactionCount: 0`).
- Group `spent` = sum of the user's `EXPENSE` transactions in the month whose category maps to the group. The category's **current** group is used, so changing a category's group changes which group its past expenses count toward. Expenses on inactive categories still count. Hard-deleted transactions (`DEC-014`) no longer exist and cannot count.
- `totalSpent` = sum of all four group `spent` values.
- `remaining = budget − spent`; negative means overspent and is never clamped. `overBudget = remaining < 0`.
- `percentUsed = spent ÷ budget × 100`, one decimal place, `HALF_UP`; `null` when the budget is `0.00` (no misleading percentage).
- Aggregation is one grouped SQL query (`GROUP BY type, category group`) scoped by `user_id`; no transaction rows are loaded into the application.
- Not included (DIV-017): `recentTransactions` (the UI reuses `GET /api/v1/transactions`), `insightPreview` (Phase 04), and any "available money" or balance figure (BR-008).

## Tests

- `backend/src/test/java/com/divido/controller/DashboardIntegrationTest.java` — reconciliation fixtures (reference, over-allocated/overspent, zero allocation), empty states, month boundaries (month end, Dec→Jan, leap February), hard delete and date edits, inactive categories, cross-user isolation.
- `backend/src/test/java/com/divido/controller/DashboardDefaultMonthIntegrationTest.java` — default month at the Colombo midnight boundary, stored timezone.
- `frontend/tests/dashboard.test.tsx`, `frontend/e2e/budget-dashboard.spec.ts` (API == UI == fixture).
