# Insights API

**Status:** IMPLEMENTED (DIV-027) — contract approved 2026-11-16 (`DEC-030` to `DEC-033`, `DEC-041`)
**Code:** `InsightsController`, `InsightsService`, `InsightCalculator`, `TransactionRepository` (backend); `lib/api/insights.ts`, `features/insights/` (frontend)
**Schema:** none. Insights are computed on request from the user's transactions and budget; nothing is stored.

## INSIGHT-001 — Read insights for a month

`GET /api/v1/insights?month=YYYY-MM` — authentication required.

`month` is optional; when omitted the server uses the current calendar month in the user's stored timezone (`app_users.timezone`, default `Asia/Colombo`). The response always states the month used.

Errors: `400 VALIDATION_ERROR` with `fieldErrors.month` for an invalid month or a month after the current one; `401 UNAUTHENTICATED`.

`200 OK` (synthetic example):
```json
{
  "month": "2026-11",
  "periodStart": "2026-11-01",
  "periodEnd": "2026-11-30",
  "asOf": "2026-11-16",
  "partialMonth": true,
  "minimumSpendingDays": 3,
  "spendingDays": 4,
  "insufficientHistory": false,
  "totalSpent": "950.00",
  "groups": [
    { "group": "NEEDS", "spent": "950.00", "sharePercent": "100.0", "expenseCount": 4 },
    { "group": "WANTS", "spent": "0.00", "sharePercent": "0.0", "expenseCount": 0 },
    { "group": "CULTURE", "spent": "0.00", "sharePercent": "0.0", "expenseCount": 0 },
    { "group": "UNEXPECTED", "spent": "0.00", "sharePercent": "0.0", "expenseCount": 0 }
  ],
  "comparison": {
    "currentStart": "2026-11-01", "currentEnd": "2026-11-16",
    "previousStart": "2026-10-01", "previousEnd": "2026-10-16",
    "currentSpent": "450.00", "previousSpent": "300.00", "changePercent": "50.0",
    "currentSpendingDays": 3, "previousSpendingDays": 3,
    "groups": [
      { "group": "NEEDS", "currentSpent": "450.00", "previousSpent": "300.00", "changePercent": "50.0" },
      { "group": "WANTS", "currentSpent": "0.00", "previousSpent": "0.00", "changePercent": null },
      { "group": "CULTURE", "currentSpent": "0.00", "previousSpent": "0.00", "changePercent": null },
      { "group": "UNEXPECTED", "currentSpent": "0.00", "previousSpent": "0.00", "changePercent": null }
    ]
  },
  "trend": [
    { "month": "2026-06", "totalSpent": null, "hasActivity": false, "partial": false },
    { "month": "2026-07", "totalSpent": null, "hasActivity": false, "partial": false },
    { "month": "2026-08", "totalSpent": "0.00", "hasActivity": true, "partial": false },
    { "month": "2026-09", "totalSpent": "200.00", "hasActivity": true, "partial": false },
    { "month": "2026-10", "totalSpent": "1300.00", "hasActivity": true, "partial": false },
    { "month": "2026-11", "totalSpent": "950.00", "hasActivity": true, "partial": true }
  ],
  "lookbackStart": "2026-08-19",
  "lookbackEnd": "2026-11-16",
  "observations": [
    { "type": "LARGEST_GROUP", "group": "NEEDS", "spent": "950.00", "sharePercent": "100.0", "spendingDays": 4 },
    { "type": "MONTH_CHANGE", "currentSpent": "450.00", "previousSpent": "300.00", "changePercent": "50.0" },
    {
      "type": "REPEATED_CATEGORY", "categoryId": "3f6c…", "categoryName": "Groceries", "group": "NEEDS",
      "distinctDays": 3, "transactionCount": 4, "dates": ["2026-08-19", "2026-09-10", "2026-11-16"]
    }
  ]
}
```

Money values are decimal strings with two places. Percentages are strings with one decimal place, `HALF_UP`, or `null` when the base is zero (DEC-041). `groups` and `comparison.groups` always list `NEEDS, WANTS, CULTURE, UNEXPECTED` in that order.

## Periods (DEC-032, DEC-041)

- **Month figures** (`totalSpent`, `groups`, `spendingDays`): the whole calendar month, using the dashboard's aggregate query and month membership (`transaction_date` between `periodStart` and `periodEnd`), so the two pages never disagree.
- **`asOf`:** the earlier of today (user timezone) and `periodEnd`. `partialMonth` is `true` while `asOf` is before `periodEnd`.
- **Comparison:** `periodStart`–`asOf` against the previous month. For a month in progress the previous range is day 1 to the same day number, clamped to the previous month's length (31 March compares with 28 or 29 February). A complete month compares with the whole previous month.
- **Lookback:** 90 calendar days inclusive ending on `asOf` (`lookbackStart = asOf − 89 days`). Used only by `REPEATED_CATEGORY`.
- **Trend:** six calendar months ending with the selected month. Months that end before the user's first transaction (of any type) have `totalSpent: null` and `hasActivity: false`, not a zero.
- Only `EXPENSE` transactions count as spending. Income is never counted. Refunds are not netted (no refund concept exists). Hard-deleted transactions no longer exist and cannot count. Each expense counts toward its category's **current** group (DEC-028).

## Observations (DEC-031)

Observations are facts; the frontend renders the approved wording. No predictions, scores, advice, causes or "habit"/"regular" labels.

| Type | Shown when | Fields |
|---|---|---|
| `LARGEST_GROUP` | `spendingDays ≥ 3`, spending above zero and one group strictly ahead (a tie names no group) | `group`, `spent`, `sharePercent`, `spendingDays` |
| `GROUP_OVER_PLAN` | A plan exists for the month, the group's budget is above `0.00` and month spending is above it (no day threshold) | `group`, `budget`, `spent`, `overBy` |
| `MONTH_CHANGE` | At least 3 distinct spending days in both comparison ranges | `currentSpent`, `previousSpent`, `changePercent` |
| `REPEATED_CATEGORY` | A category with expenses on at least 3 distinct days in the lookback; most days first, then most expenses, then name | `categoryId`, `categoryName`, `group`, `distinctDays`, `transactionCount`, `dates` |

`insufficientHistory` is `true` when `spendingDays < minimumSpendingDays` (3). The UI then explains that more data is needed (AC-019); observations that meet their own rules (for example `GROUP_OVER_PLAN`) are still returned.

## Security and privacy

- Every query is scoped by the session user's id; no parameter names a user. Another user's records never affect the result.
- Descriptions and payment methods are not read. Nothing is stored or logged.

## Tests

- `backend/src/test/java/com/divido/service/InsightCalculatorTest.java` (rounding, zero bases, lookback, range clamping, leap year)
- `backend/src/test/java/com/divido/controller/InsightsIntegrationTest.java` (Testcontainers; fixed clock 2026-11-16 Colombo: thresholds below/at 3 days, tie, plan rules, partial and complete month comparison, hard delete, lookback day 90/91, trend before the first record, income ignored, dashboard consistency, isolation, future month)
- `frontend/tests/insights.test.tsx`
