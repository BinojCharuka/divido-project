# Phase 02 — Income, Expenses, Categories, and Transactions

**Status:** COMPLETED — merged via PR #16 (merge commit `0a898a0`) and verified on `main` on 2026-11-04. One test-gate item (month/timezone date policy) is conditional on a pending decision; see the Test gate below and `docs/00-governance/progress-tracker.md`.  
**Primary outcome:** A user can record and review income and expenses with consistent data integrity.

## Goal

Deliver the core daily-use path: choose a category, record an income or expense, and view saved transactions. Keep the first slice small and integrate it before adding advanced filters or secondary features.

## Entry criteria

- Phase 01 authentication and user ownership gates pass.
- Transaction fields, category rules, amount precision, date semantics, and deletion behavior are approved.
- API contracts and data model are reviewed.
- Migration strategy matches the current applied schema.

## Suggested slice order

> **Historical planning checklist.** The slice list below is the original delivery plan and is intentionally left unticked; it is not the completion record. Phase 02 was delivered through DIV-008A–DIV-024 (PRs #7–#16). Completion is assessed against the **Test gate** and **Exit criteria** sections below, with evidence recorded in [`progress-tracker.md`](../00-governance/progress-tracker.md) (Section B notes). Some slice items were deliberately moved out of Phase 02: planned-vs-actual income (DEC-020, `PROPOSED`) and effects on budgets and insights belong to Phase 03/04, and restore was removed by DEC-014.

### Slice 2A — Read categories
- [ ] Seed approved built-in categories idempotently.
- [ ] Confirm Kakeibo group mapping.
- [ ] Implement category list endpoint and UI selector.
- [ ] Test category visibility and ordering.

### Slice 2B — Create expense
- [ ] Implement minimal expense request/response contract.
- [ ] Validate amount, category, date, and optional fields.
- [ ] Persist transaction with owner derived from authenticated context.
- [ ] Build quick-entry form and pending/error/success states.
- [ ] Verify one submit creates one record and reload returns the saved values.

### Slice 2C — List and inspect transactions
- [ ] Implement user-scoped list endpoint.
- [ ] Agree default ordering and any date filters.
- [ ] Add list/loading/empty/error UI.
- [ ] Verify date boundaries and user isolation.

### Slice 2D — Income tracking
- [ ] Confirm how planned income differs from actual income.
- [ ] Implement income transaction behavior.
- [ ] Add income source association only if approved.
- [ ] Verify income is not counted as an expense.

### Slice 2E — Edit and delete/restore
- [ ] Implement only the approved mutation behavior.
- [ ] Confirm effects on lists, totals, budgets, and insights.
- [ ] Test invalid references, not-found, ownership, and deleted-record behavior.

### Slice 2F — Custom categories and payment methods
- [ ] Implement only if explicitly included in MVP.
- [ ] Enforce category uniqueness and ownership policy.
- [ ] Keep payment method optional if that is the approved decision.
- [ ] Test archived/deleted category references and historical records.

## Shared responsibilities

**Backend developer**
- API, service rules, persistence, validation, migration, ownership checks, backend tests.

**Frontend developer**
- Quick-entry and list UI, client validation, loading/empty/error states, accessible controls, frontend tests.

**Both**
- Agree on API contract before parallel coding.
- Run integrated create → reload → list journey.
- Update OpenAPI, data dictionary, user story, and traceability.

## Test gate

Verified on `main` at `0a898a0` on 2026-11-04: `./mvnw verify` 284/284, Vitest 100/100, Playwright 15/15 against a disposable PostgreSQL.

- [x] Valid expense persists once. — `TransactionIntegrationTest` `userCanCreateAndRetrieveExpenseWithGlobalCategory`; `e2e/transactions.spec.ts` full journey (list count checked through the API).
- [x] Valid income persists with correct type. — `TransactionIntegrationTest` `userCanCreateIncomeWithAndWithoutIncomeSource`; `e2e/transactions.spec.ts` sourced and sourceless income (DEC-003).
- [x] Zero/negative/malformed/excess-precision amounts are rejected. — `TransactionIntegrationTest` `moneySafetyAndValidationRules`, `moneySafetyMaxRangeAndMalformedInputs`.
- [x] Invalid or unauthorized category references are rejected. — `TransactionIntegrationTest` `nonexistentReferencesAreRejectedOnCreateAndPatch`, `crossUserCategoryAndIncomeSourceIsolationEnforced`, `inactiveCategoryOrIncomeSourceIsRejected`; `e2e/transactions.spec.ts` cross-user category/income-source journey.
- [x] User B cannot read or mutate User A's transaction. — `TransactionIntegrationTest` `crossUserIsolationEnforcedOnAllOperations`; `e2e/transactions.spec.ts` cross-user journey (GET/PATCH/DELETE return 404; edit page shows not-found).
- [ ] **Partially met — conditional on a pending decision:** Date filtering follows approved timezone/month rules. Inclusive date-only `from`/`to` boundaries are verified (`TransactionIntegrationTest` `exactInclusiveDateBoundariesAndCombinedFilters`). However, no month/timezone policy is approved yet (it is part of the DIV-025 decision gate), and the frontend derives the "current month" from the browser's local date rather than an explicit `Asia/Colombo` rule. This is to be finalised when that policy is approved.
- [x] Failed requests do not create partial records. — `TransactionIntegrationTest` `rejectedCreateDoesNotPersistAnyRecords`, `rejectedPatchDoesNotPartiallyModifyData`; `e2e/transactions.spec.ts` "a failed backend write never shows success".
- [x] UI handles loading, empty, validation, server error, and session expiry. — `tests/transactions.test.tsx`, `tests/management.test.tsx` (validation, server errors, filtered-empty state, retry); `tests/auth-flows.test.tsx` and `e2e/auth.spec.ts` ("an ended session returns the user to sign-in").
- [x] Migration and repository tests pass. — `TransactionSchemaMigrationTest` and the full backend suite (284/284).

## Exit criteria

- [x] A user can create and review the approved transaction types end-to-end. — `e2e/transactions.spec.ts` full journey: create, list, filter, edit, delete.
- [x] Server-side validation and ownership checks pass. — `TransactionIntegrationTest` and the category/income-source integration tests, within the 284/284 suite.
- [x] Database integrity and migration checks pass. — `TransactionSchemaMigrationTest`; Flyway V1–V3 applied cleanly to a fresh database during E2E.
- [x] Frontend uses the real API, not production mock data. — The prototype was removed from production routes in PR #16. `e2e/transactions.spec.ts` checks that `/prototype` returns 404 and that no `divido-*` `localStorage` keys are written.
- [x] Tests and docs are updated. — PR #16 (tests, tracker, `transactions-api.md`, DEC-013) and PR #17 (tracker closeout, this checklist, `TRACEABILITY_MATRIX.md`).
- [x] No P0/P1 defect remains without explicit owner-approved exception. — No open P0/P1 defect was known at 2026-11-04. The date-policy item above is a pending decision, not a defect. Lint errors remain in files outside Phase 02 (`FigmaApp.tsx`, `lib/api/dashboard.ts`, `lib/api/insights.ts`).

## Do not add yet unless approved

Bank synchronization, shared expenses, account balances, recurring transactions, transfers, and Money Lending Tracker are outside the proposed MVP boundary unless the owner explicitly changes scope.
