# Cross-Feature Test Cases

**Status:** Proposed test inventory — map cases to approved user stories before execution  
**Note:** IDs are stable references for issues and traceability. Cases marked conditional depend on product decisions that are not yet frozen.

## 1. Test case format

Each case lists an ID, priority, preconditions, steps, and expected result. Add environment, build/version, tester, execution date, actual result, and evidence when running it.

## 2. Environment and baseline

### TC-GEN-001 — Fresh setup
**Priority:** P1  
**Preconditions:** Clean test environment and documented configuration.
1. Follow the environment setup guide from a clean checkout.
2. Start database, backend, and frontend using documented commands.
3. Run the documented test commands.
**Expected:** Setup succeeds without undocumented manual edits; secrets are supplied outside source control.

### TC-GEN-002 — Health endpoint
**Priority:** P1  
**Preconditions:** Backend running.
1. Request the documented health endpoint.
**Expected:** Response matches the actual documented contract and does not expose environment secrets or internal configuration. Confirm the endpoint's exact response shape against implementation; do not assume it from the path alone.

### TC-GEN-003 — Configuration missing
**Priority:** P1  
**Preconditions:** Test environment with one required configuration value omitted.
1. Start the affected service.
**Expected:** Service fails safely or reports a clear configuration error; it does not silently connect to an unintended database or use insecure production defaults.

## 3. Authentication and onboarding

### TC-AUTH-001 — Valid login
**Priority:** P1  
**Preconditions:** Synthetic test account exists.
1. Submit valid credentials.
2. Navigate to an authenticated route.
**Expected:** Authenticated state is established using the agreed session mechanism; private content is available only to that session.

### TC-AUTH-002 — Invalid login
**Priority:** P1  
1. Submit an invalid credential combination.
**Expected:** Login is rejected with a safe, consistent message; no session is granted and no sensitive details are revealed.

### TC-AUTH-003 — Logout invalidates session
**Priority:** P1  
1. Log in.
2. Log out.
3. Reuse the previous session in a protected request.
**Expected:** The old session no longer grants access.

### TC-AUTH-004 — Onboarding completion
**Priority:** P1  
**Preconditions:** New synthetic account.
1. Complete the approved onboarding fields.
2. Refresh and sign in again.
**Expected:** Saved values persist and the app routes the user according to the approved onboarding rule.

### TC-AUTH-005 — Incomplete onboarding
**Priority:** P2  
1. Submit missing or invalid required fields.
**Expected:** Errors identify fields clearly; invalid state is not saved as complete.

## 4. Categories and income sources

### TC-CAT-001 — Built-in categories available
**Priority:** P1  
1. Request categories as an authenticated user.
**Expected:** The agreed built-in categories and Kakeibo group mappings are returned consistently.

### TC-CAT-002 — Create custom category
**Priority:** P2, conditional on MVP scope.
1. Create a valid custom category.
2. Reload the list.
**Expected:** Category persists and is visible only according to the approved ownership/sharing rules.

### TC-CAT-003 — Duplicate category
**Priority:** P2  
1. Create a category.
2. Attempt to create a duplicate under the approved normalization rules.
**Expected:** Behavior matches the approved uniqueness policy; no accidental duplicate is created.

### TC-INC-001 — Income source lifecycle
**Priority:** P2, conditional on approved income-source management.
1. Create or select an income source.
2. Record income linked to it.
3. Rename/archive/delete it as allowed.
**Expected:** Historical transaction behavior follows the approved reference/deletion policy.

## 5. Transactions

### TC-TXN-001 — Create expense
**Priority:** P0/P1  
**Preconditions:** Authenticated user and valid category.
1. Enter a valid positive amount and required category.
2. Submit once.
3. Reload the transaction list.
**Expected:** One transaction persists with correct amount, date, category, and optional fields; no duplicate record is created.

### TC-TXN-002 — Reject invalid expense amount
**Priority:** P1  
Try zero, negative, malformed, excessive precision, and over-limit amount values according to the approved contract.
**Expected:** Invalid amounts are rejected consistently; database state remains unchanged.

### TC-TXN-003 — Create income
**Priority:** P1  
1. Submit valid income with approved required fields.
**Expected:** Income is stored as income, not expense, and contributes only to the intended aggregates.

### TC-TXN-004 — Edit transaction
**Priority:** P1  
1. Create a transaction.
2. Change one editable field.
3. Reload it.
**Expected:** Allowed changes persist; immutable fields remain protected as specified.

### TC-TXN-005 — Delete and restore
**Priority:** P1, conditional on soft-delete/restore being approved.
1. Delete a transaction.
2. Verify it is excluded/included in views and totals according to policy.
3. Restore it if restore is supported.
**Expected:** Deletion and restoration semantics are consistent across list, dashboard, budgets, and insights.

### TC-TXN-006 — Invalid category reference
**Priority:** P1  
1. Submit a category ID that does not exist or is not available to the current user.
**Expected:** Request is rejected safely; no transaction is persisted.

### TC-TXN-007 — Duplicate submit
**Priority:** P1  
1. Submit a transaction and trigger a repeated submit while the first request is pending.
**Expected:** UI prevents accidental repeat where possible; server-side behavior follows the agreed idempotency/duplicate policy. Do not assume an idempotency key exists unless specified.

### TC-TXN-008 — User cannot access another user's transaction
**Priority:** P0  
1. Create a transaction for synthetic user A.
2. Authenticate as synthetic user B.
3. Try to read, update, and delete user A's transaction using its ID.
**Expected:** No protected data is returned and no mutation occurs; responses follow the documented not-found/forbidden policy.

## 6. Budget and dashboard

### TC-BUD-001 — Save monthly budget
**Priority:** P1  
1. Save the approved monthly plan.
2. Reload it.
**Expected:** Planned income, group allocations, and savings target persist distinctly from actual transaction totals.

### TC-BUD-002 — Allocation exceeds planned income
**Priority:** P1, conditional on warning rule approval.
1. Set allocations plus savings target above planned income.
**Expected:** Warning behavior matches the approved rule; user-facing totals are understandable and values are not silently altered unless that behavior is explicitly approved.

### TC-DASH-001 — Dashboard totals reconcile
**Priority:** P0/P1  
**Preconditions:** Deterministic dataset with income, expenses, categories, dates, and deleted records.
1. Open the dashboard for a selected month.
2. Compare each total with independently calculated expected values.
**Expected:** Totals match the approved definitions and month boundary/timezone policy.

### TC-DASH-002 — Month boundary
**Priority:** P1  
Create transactions immediately before and after the defined month boundary.
**Expected:** Each transaction belongs to the expected month under the approved date/time model.

### TC-DASH-003 — Empty month
**Priority:** P2  
Open a month with no transactions.
**Expected:** Empty state and zero/unknown values follow the product design; no divide-by-zero or misleading percentage appears.

## 7. Insights and reflection

### TC-INS-001 — Insufficient history
**Priority:** P1  
Use a test user with too little history to meet the approved threshold.
**Expected:** No unsupported habit claim is presented; the UI clearly indicates insufficient data or omits the insight according to the design.

### TC-INS-002 — Habit eligibility boundary
**Priority:** P1  
Test history just below, exactly at, and just above the approved data threshold.
**Expected:** Results follow the documented algorithm deterministically.

### TC-INS-003 — User isolation for insights
**Priority:** P0  
Create distinct spending histories for two users and request each user's insights.
**Expected:** No transactions or aggregates from one user influence the other user's private results unless an explicitly approved shared feature exists.

### TC-REF-001 — Save reflection
**Priority:** P2, conditional on MVP scope.
1. Save an approved reflection response.
2. Reload it.
**Expected:** Response persists and is visible only to its owner.

### TC-REF-002 — Retention/deletion
**Priority:** P2, conditional on approved retention policy.
**Expected:** Reflection deletion, editability, and retention match the approved data lifecycle rules.

## 8. Cross-cutting failure cases

### TC-X-001 — Backend unavailable
**Priority:** P1  
Attempt a user action while the API is unavailable.
**Expected:** UI shows a recoverable error, does not claim success, and does not silently show mock data as real.

### TC-X-002 — Session expires during editing
**Priority:** P1  
Expire the session while a form is open and submit it.
**Expected:** Server rejects the request; UI asks the user to authenticate again and preserves recoverable input where safe.

### TC-X-003 — Concurrent update
**Priority:** P2  
Two requests update the same record close together.
**Expected:** Behavior matches the concurrency policy; the system does not silently corrupt related fields.

### TC-X-004 — Migration from current schema
**Priority:** P0/P1  
Run the new migration sequence against a disposable copy of the current supported schema.
**Expected:** Migrations succeed, existing data remains intact, and application tests pass.

## 9. Execution record

For every run, record: test ID, environment/build, date, tester, pass/fail/blocked, actual result, issue link, and evidence location. Never put credentials or real financial records in evidence.
