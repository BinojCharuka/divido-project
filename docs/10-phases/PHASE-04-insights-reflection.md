# Phase 04 — Spending Insights and Reflection

**Status:** IMPLEMENTED on branch `feature/div-027-028-insights-reflection` (2026-11-16) — not yet merged, deployed, or applied to production  
**Gates:** Decisions DEC-030 to DEC-042 approved 2026-11-16 ([`PHASE-04-decisions.md`](PHASE-04-decisions.md)); DIV-036 completed and verified 2026-11-16. V6 (`V6__reflections.sql`) is written; production apply is a release step.  
**Primary outcome:** Provide explainable spending-pattern observations and reflection tools without overstating what the data proves.

## Goal

Add value beyond transaction recording only after enough trustworthy history exists and the team has agreed on the rules. Insights must be transparent, private, and deterministic for a rule-based MVP.

## Entry criteria

- Transaction data is stable and accurate.
- Owner has approved whether insights and reflections belong in MVP.
- Habit algorithm, minimum-data threshold, lookback window, and explanation copy are documented.
- Reflection questions, editability, and retention are approved.
- Privacy and user-isolation test cases are ready.

## Workstreams

### BE-01 — Habit/insight rules
- [x] Define the rule in plain language before implementation.
- [x] Define eligible transaction types, categories, time window, and minimum distinct spending days.
- [x] Define how refunds, deleted records, sparse history, and missing dates affect results.
- [x] Return an explanation of which period/data supports an insight where appropriate.
- [x] Avoid claims that imply certainty when the data supports only a pattern.
- [x] Add tests below, at, and above each threshold.

### BE-02 — Reflection persistence
- [x] Confirm whether reflections are stored in MVP.
- [x] Define fields, edit/delete behavior, and retention.
- [x] Enforce owner access on every operation.
- [x] Add data-retention and migration tests.

### FE-01 — Insights UI
- [x] Show only approved insight types.
- [x] Clearly handle insufficient data.
- [x] Avoid shaming or judgmental wording.
- [x] Explain the relevant period and signal in accessible language.
- [x] Ensure no insight is generated from another user's records.

### FE-02 — Reflection UI
- [x] Present approved reflection questions.
- [x] Save only through the agreed API.
- [x] Show pending, success, validation, and failure states.
- [x] Support edit/delete only if approved.

### INT-01 — Privacy and confidence checks
- [x] Verify two users' histories remain isolated.
- [x] Test threshold boundaries with fixed synthetic data.
- [x] Test that failed saves do not display false success.
- [x] Verify deleted records and retention policy affect insights as specified.

## Exit criteria

- [x] Product scope for insights/reflections is explicitly approved.
- [x] Algorithm and retention rules are documented and tested.
- [x] Insufficient data is handled safely and clearly.
- [x] User isolation tests pass.
- [x] UI and API behavior is integrated and verified.
- [x] Data dictionary, API docs, and privacy/retention docs are current.

## Implementation record (2026-11-16)

- Insights: `GET /api/v1/insights?month` — see [`../05-api/insights-api.md`](../05-api/insights-api.md). Rules: DEC-031, DEC-032, DEC-033, DEC-041. Nothing stored.
- Reflections: `GET/PUT/DELETE /api/v1/reflections/{month}`, `GET /api/v1/reflections` — see [`../05-api/reflections-api.md`](../05-api/reflections-api.md). Rules: DEC-034 to DEC-040. Tables `reflections`, `reflection_answers` (V6).
- UI: `/insights` and `/reflection` on the Figma UI (DEC-029), plain labels with one Kakeibo explanation on the reflection page (DEC-042).
- Remaining before the phase is closed: review and merge, apply V6 to production, production smoke check. The legacy `monthly_reflections` row stays untouched (DEC-036).

## Scope guard

Do not introduce machine learning, bank aggregation, shared financial profiles, or predictive claims for a simple rule-based insight unless there is an explicit approved product and risk case.
