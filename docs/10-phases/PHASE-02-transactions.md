# Phase 02 — Income, Expenses, Categories, and Transactions

**Status:** Proposed sequence — depends on approved transaction/category contracts  
**Primary outcome:** A user can record and review income and expenses with consistent data integrity.

## Goal

Deliver the core daily-use path: choose a category, record an income or expense, and view saved transactions. Keep the first slice small and integrate it before adding advanced filters or secondary features.

## Entry criteria

- Phase 01 authentication and user ownership gates pass.
- Transaction fields, category rules, amount precision, date semantics, and deletion behavior are approved.
- API contracts and data model are reviewed.
- Migration strategy matches the current applied schema.

## Suggested slice order

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

- [ ] Valid expense persists once.
- [ ] Valid income persists with correct type.
- [ ] Zero/negative/malformed/excess-precision amounts are rejected.
- [ ] Invalid or unauthorized category references are rejected.
- [ ] User B cannot read or mutate User A's transaction.
- [ ] Date filtering follows approved timezone/month rules.
- [ ] Failed requests do not create partial records.
- [ ] UI handles loading, empty, validation, server error, and session expiry.
- [ ] Migration and repository tests pass.

## Exit criteria

- [ ] A user can create and review the approved transaction types end-to-end.
- [ ] Server-side validation and ownership checks pass.
- [ ] Database integrity and migration checks pass.
- [ ] Frontend uses the real API, not production mock data.
- [ ] Tests and docs are updated.
- [ ] No P0/P1 defect remains without explicit owner-approved exception.

## Do not add yet unless approved

Bank synchronization, shared expenses, account balances, recurring transactions, transfers, and Money Lending Tracker are outside the proposed MVP boundary unless the owner explicitly changes scope.
