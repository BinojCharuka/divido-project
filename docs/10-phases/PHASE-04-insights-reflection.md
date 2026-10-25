# Phase 04 — Spending Insights and Reflection

**Status:** Conditional proposed phase — MVP inclusion must be approved  
**Primary outcome:** If approved, provide explainable spending-pattern observations and reflection tools without overstating what the data proves.

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
- [ ] Define the rule in plain language before implementation.
- [ ] Define eligible transaction types, categories, time window, and minimum distinct spending days.
- [ ] Define how refunds, deleted records, sparse history, and missing dates affect results.
- [ ] Return an explanation of which period/data supports an insight where appropriate.
- [ ] Avoid claims that imply certainty when the data supports only a pattern.
- [ ] Add tests below, at, and above each threshold.

### BE-02 — Reflection persistence
- [ ] Confirm whether reflections are stored in MVP.
- [ ] Define fields, edit/delete behavior, and retention.
- [ ] Enforce owner access on every operation.
- [ ] Add data-retention and migration tests.

### FE-01 — Insights UI
- [ ] Show only approved insight types.
- [ ] Clearly handle insufficient data.
- [ ] Avoid shaming or judgmental wording.
- [ ] Explain the relevant period and signal in accessible language.
- [ ] Ensure no insight is generated from another user's records.

### FE-02 — Reflection UI
- [ ] Present approved reflection questions.
- [ ] Save only through the agreed API.
- [ ] Show pending, success, validation, and failure states.
- [ ] Support edit/delete only if approved.

### INT-01 — Privacy and confidence checks
- [ ] Verify two users' histories remain isolated.
- [ ] Test threshold boundaries with fixed synthetic data.
- [ ] Test that failed saves do not display false success.
- [ ] Verify deleted records and retention policy affect insights as specified.

## Exit criteria

- [ ] Product scope for insights/reflections is explicitly approved.
- [ ] Algorithm and retention rules are documented and tested.
- [ ] Insufficient data is handled safely and clearly.
- [ ] User isolation tests pass.
- [ ] UI and API behavior is integrated and verified.
- [ ] Data dictionary, API docs, and privacy/retention docs are current.

## Scope guard

Do not introduce machine learning, bank aggregation, shared financial profiles, or predictive claims for a simple rule-based insight unless there is an explicit approved product and risk case.
