# Phase 03 — Monthly Budgets and Dashboard

**Status:** MERGED — PR #18 squash-merged to `main` as `fe6e10455463b5ea1b49d5540f13bdf5418a7a8d` on 2026-11-04. PR-local checks reported passing; post-merge `main` verification and Neon schema deployment remain pending. Production V4 history drift is tracked by DIV-036 / PR #20  
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
- [x] Define unique budget period and ownership rules.
- [x] Define planned income vs actual income semantics.
- [x] Define allocations for the four Kakeibo groups if confirmed.
- [x] Define savings target semantics and how it affects available budget.
- [x] Implement create/read/update behavior according to approved contract.
- [x] Validate duplicate period, negative values, precision, and allocation boundaries.
- [x] Add migration and repository/service tests.

### BE-02 — Dashboard aggregation
- [x] Define each total in plain language and formula.
- [x] Define how income, expenses, deleted records (hard delete, DEC-014), and custom categories are included.
- [x] Define date filters and month boundaries.
- [x] Implement user-scoped aggregate queries.
- [x] Test with deterministic fixtures and independently calculated expected values.
- [x] Verify empty months and zero-denominator cases.

### FE-01 — Budget UI
- [x] Build monthly plan form against approved fields.
- [x] Distinguish planned values from actual totals.
- [x] Show the approved warning if allocations plus savings target exceed planned income.
- [x] Preserve form values on validation failure.
- [x] Add loading, empty, success, and error states.

### FE-02 — Dashboard UI
- [x] Render server-provided totals and group summaries.
- [x] Implement month navigation according to the approved timezone/date model.
- [x] Format LKR or other approved currency without changing numeric meaning.
- [x] Avoid misleading percentages when denominator is zero or unavailable.
- [x] Provide an understandable empty state.

### INT-01 — Reconciliation
- [x] Create synthetic fixture set with known income and expenses.
- [x] Calculate expected values independently.
- [x] Compare API response and UI display to expected values.
- [x] Test month boundaries, deleted records, empty months, and invalid requests.

## Exit criteria

- [x] Budget plan persists and reloads correctly.
- [x] Planned and actual amounts are clearly distinct.
- [x] Dashboard totals match independent calculations.
- [x] Month boundary and timezone behavior are tested.
- [x] Ownership isolation passes for budgets and aggregates.
- [x] Warning behavior matches approved business rules.
- [x] UI and API tests pass; docs reflect actual calculations.
- [x] PR #18 merged into `main` (squash commit `fe6e10455463b5ea1b49d5540f13bdf5418a7a8d`).
- [ ] Re-run backend, frontend, build and E2E verification on the exact merged `main` commit (required before Phase 03 is `COMPLETED`).
- [ ] Resolve production V4 history drift using the reviewed DIV-036 runbook; do not re-run V4 SQL on production.
- [ ] After explicit approval, perform supervised Flyway `repair` then `migrate` (V5) on the intended Neon production branch; verify Flyway history, `monthly_budgets`, and preservation of legacy `budgets` / `monthly_reflections` data.

## Risk note

A visually attractive dashboard with incorrect or ambiguous financial arithmetic is not acceptable. If a formula is undecided, block the dependent implementation and record the decision rather than guessing.

## Implementation record (DIV-017 / DIV-025 / DIV-026)

- Rules: [`DEC-028`](../00-governance/decision-log.md) (formulas, precision, required fields, month/timezone, missing plan, contract scope) and `DEC-012` (warn, never block, on over-allocation).
- Schema: `monthly_budgets`, repository Flyway `V4__monthly_budgets.sql` on fresh databases; production compatibility bridge `V5__monthly_budgets.sql` is proposed in PR #20 because Neon already records a different V4 script.
- API: [Budgets API](../05-api/budgets-api.md) (`GET`/`PUT /api/v1/budgets/{month}`), [Dashboard API](../05-api/dashboard-api.md) (`GET /api/v1/dashboard`).
- UI: `/budget` (`features/budget/BudgetPlanner.tsx`), `/dashboard` (`features/dashboard/DashboardView.tsx`), shared `MonthNavigator`; month kept in `?month=YYYY-MM`.
- Tests: backend `BudgetCalculatorTest`, `BudgetMonthTest`, `BudgetIntegrationTest`, `DashboardIntegrationTest`, `DashboardDefaultMonthIntegrationTest`; frontend `tests/budget-plan.test.ts`, `tests/budget.test.tsx`, `tests/dashboard.test.tsx`; E2E `e2e/budget-dashboard.spec.ts`.
- PR-reported verification (branch, not post-merge): backend `./mvnw test` 354/354; frontend typecheck pass, `npm test` 137/137, E2E 22/22 against isolated backend/disposable Postgres, production build pass. `npm run lint` reports pre-existing findings only (7 errors / 15 warnings in prototype, insights API and AuthPageShell). No GitHub Actions checks exist.
- Known limitations: no optimistic-lock/version check (last write wins); dashboard uses each category's current group, so regrouping a category moves its past expenses; timezone is not user-editable yet (DIV-022), so the UI uses the `Asia/Colombo` default. Neon migration status must not be described as applied until verified. Production's earlier V4 created legacy `budgets`, `monthly_reflections` and profile columns; preserve these objects and the existing reflection row.
