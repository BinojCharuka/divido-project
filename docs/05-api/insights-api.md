# Insights API

**Status:** Proposed contract — insight algorithm not yet approved

## INSIGHT-001 — List insights

`GET /api/v1/insights?from=YYYY-MM-DD&to=YYYY-MM-DD`

Proposed response:
```json
{
  "from": "2026-07-28",
  "to": "2026-10-25",
  "items": [
    {
      "id": "string",
      "type": "SPENDING_PATTERN",
      "title": "Example observation",
      "description": "A neutral explanation based on recorded entries.",
      "group": "WANTS",
      "evidence": {
        "transactionCount": 4,
        "distinctSpendingDays": 3
      }
    }
  ],
  "insufficientHistory": false
}
```

This is illustrative only. Do not use example copy as a final generated insight.

## Rules

- Proposed default lookback is 90 days; exact boundaries and timezone rules are TBD.
- Proposed minimum of three distinct spending days is not a complete algorithm.
- Backend calculates insights from eligible user-owned records.
- Do not expose another user's data or internal scoring details that could be misleading.
- Insight wording must be evidence-based, non-judgmental, and avoid unsupported causal claims.
- If history is insufficient, return a documented empty/insufficient-history response.
- Do not invent predictions or label a pattern “regular” until the approved criteria pass.

## Open decisions

- Insight types and algorithm.
- Minimum history and confidence thresholds.
- Whether users can select a date range.
- Evidence fields safe/useful for UI.
- Whether insight generation is synchronous or precomputed.
- Whether Insights is part of MVP.
