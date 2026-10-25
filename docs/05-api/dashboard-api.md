# Dashboard API

**Status:** Proposed contract

## DASH-001 — Read monthly dashboard

`GET /api/v1/dashboard?month=YYYY-MM`

**Authentication:** Required.

Response `200 OK` (illustrative):
```json
{
  "month": "2026-10",
  "plannedIncome": "100000.00",
  "recordedIncome": "85000.00",
  "savingsTarget": "15000.00",
  "groups": [
    {
      "group": "NEEDS",
      "budget": "40000.00",
      "spent": "22000.00",
      "remaining": "18000.00"
    },
    {
      "group": "WANTS",
      "budget": "20000.00",
      "spent": "9000.00",
      "remaining": "11000.00"
    },
    {
      "group": "CULTURE",
      "budget": "10000.00",
      "spent": "3000.00",
      "remaining": "7000.00"
    },
    {
      "group": "UNEXPECTED",
      "budget": "5000.00",
      "spent": "1000.00",
      "remaining": "4000.00"
    }
  ],
  "recentTransactions": [],
  "insightPreview": null
}
```

Values are examples only, not actual user data.

## Rules

- `month` is a calendar month; if omitted, use the current month in the approved user timezone.
- Every amount identifies planned versus actual meaning.
- `recordedIncome` sums eligible income entries for that month.
- `spent` sums eligible active expenses whose category maps to the group and whose date falls in that month.
- `remaining = budget - spent`; it may be negative when over budget.
- Soft-deleted entries are excluded if soft deletion is approved.
- No plan/history should produce an explicit documented empty/null state, not fabricated zero totals.
- Backend owns calculations and returns consistent values.

## Open decisions

- Whether Dashboard returns recent transactions and insight preview in one response or the frontend calls separate endpoints.
- Maximum recent transaction count.
- Missing plan representation.
- Whether recorded income minus expenses or any “available money” figure is shown; do not add it without product approval.
