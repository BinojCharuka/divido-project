# Phase 03 — Monthly Budgets and Dashboard

**Status:** Proposed sequence — depends on approved calculation rules  
**Primary outcome:** Users can plan a month and compare planned amounts with actual transactions.

## Goal

Deliver a trustworthy monthly view. Financial totals must be defined precisely before UI implementation; the frontend should not invent its own interpretation of planned income, actual income, spending, or savings.

## Entry criteria

- Transaction records and categories work end-to-end.
- Currency, amount precision, month boundary, timezone, and deleted-record rules are approved.
- Budget allocation and savings-target rules are approved.
- Dashboard response schema is agreed in OpenAPI.

## Workstreams

### BE-01 — Budget model and API
- [ ] Define unique budget period and ownership rules.
- [ ] Define planned income vs actual income semantics.
- [ ] Define allocations for the four Kakeibo groups if confirmed.
- [ ] Define savings target semantics and how it affects available budget.
- [ ] Implement create/read/update behavior according to approved contract.
- [ ] Validate duplicate period, negative values, precision, and allocation boundaries.
- [ ] Add migration and repository/service tests.

### BE-02 — Dashboard aggregation
- [ ] Define each total in plain language and formula.
- [ ] Define how income, expenses, soft-deleted records, and custom categories are included.
- [ ] Define date filters and month boundaries.
- [ ] Implement user-scoped aggregate queries.
- [ ] Test with deterministic fixtures and independently calculated expected values.
- [ ] Verify empty months and zero-denominator cases.

### FE-01 — Budget UI
- [ ] Build monthly plan form against approved fields.
- [ ] Distinguish planned values from actual totals.
- [ ] Show the approved warning if allocations plus savings target exceed planned income.
- [ ] Preserve form values on validation failure.
- [ ] Add loading, empty, success, and error states.

### FE-02 — Dashboard UI
- [ ] Render server-provided totals and group summaries.
- [ ] Implement month navigation according to the approved timezone/date model.
- [ ] Format LKR or other approved currency without changing numeric meaning.
- [ ] Avoid misleading percentages when denominator is zero or unavailable.
- [ ] Provide an understandable empty state.

### INT-01 — Reconciliation
- [ ] Create synthetic fixture set with known income and expenses.
- [ ] Calculate expected values independently.
- [ ] Compare API response and UI display to expected values.
- [ ] Test month boundaries, deleted records, empty months, and invalid requests.

## Exit criteria

- [ ] Budget plan persists and reloads correctly.
- [ ] Planned and actual amounts are clearly distinct.
- [ ] Dashboard totals match independent calculations.
- [ ] Month boundary and timezone behavior are tested.
- [ ] Ownership isolation passes for budgets and aggregates.
- [ ] Warning behavior matches approved business rules.
- [ ] UI and API tests pass; docs reflect actual calculations.

## Risk note

A visually attractive dashboard with incorrect or ambiguous financial arithmetic is not acceptable. If a formula is undecided, block the dependent implementation and record the decision rather than guessing.
