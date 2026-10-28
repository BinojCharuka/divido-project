# Use Cases

**Status:** Proposed — owner review required

## UC-001 — Create an account and start a session

**Primary actor:** Visitor  
**Goal:** Create an individual Divido account and enter the app securely.

**Preconditions:** User has access to the app and is not authenticated.  
**Trigger:** User chooses Create account.

**Main flow**
1. System displays the registration form.
2. User enters the approved required fields.
3. Client validates obvious format errors.
4. Backend validates input and creates the account using secure credential handling.
5. Backend creates an authenticated session according to the security design.
6. User is routed to onboarding if setup is incomplete, otherwise Dashboard.

**Alternates/errors**
- Invalid fields: show field-specific messages.
- Account identifier already exists: show a safe, non-sensitive response.
- Server unavailable: retain safe input and allow retry.
- Session creation fails: do not imply that the user is signed in.

**Postconditions:** Account exists once; user has a valid session only if session creation succeeded.

**Open decisions:** Authentication identifier, password policy, email/phone verification, account recovery and rate limits.

> **OPEN — step 5 (`DEC-025`):** whether registration itself creates a session is deferred to DIV-006. The current implementation (DIV-005) creates the account only and does not establish a session, so step 5 and the session part of the postconditions are not yet met.

## UC-002 — Sign in and sign out

**Primary actor:** Registered user  
**Goal:** Access their own data and end the current session.

**Preconditions:** Account exists.  
**Main flow:** User submits credentials; backend verifies them; session is created/renewed; user reaches a safe intended route. On sign-out, the server invalidates the session and the UI returns to a public route.

**Errors:** Invalid credentials, locked/rate-limited attempt, expired session, network failure.

**Security rule:** Client route guards are not authorization. Every protected backend request validates session and user ownership.

## UC-003 — Complete onboarding

**Primary actor:** Authenticated new user  
**Goal:** Set up preferences and an initial monthly money plan.

**Main flow**
1. Show the next incomplete onboarding step.
2. Collect approved profile/preferences.
3. Collect income-source labels and planned income as defined by the approved model.
4. Collect savings target and group allocations if required.
5. Summarize the plan and show any over-allocation warning.
6. Save and mark onboarding complete.

**Alternates:** User returns later; save fails; plan values are invalid; allocations exceed planned income.

**Open decisions:** Required fields, skippable steps, draft persistence, and whether onboarding can be completed with an over-allocated plan.

## UC-004 — View the dashboard

**Primary actor:** Authenticated user  
**Goal:** Understand the selected month's money picture.

**Main flow:** System loads planned income, recorded income, savings target, group budget versus eligible spending, recent entries, and available insight/reflection entry points.

**Alternates:** No plan, no transactions, partial API failure, expired session, selected month has no data.

**Postconditions:** Displayed figures identify their period and planned/actual meaning.

## UC-005 — Create an expense

**Primary actor:** Authenticated user  
**Goal:** Record money spent.

**Preconditions:** Valid session; at least one selectable active category mapped to a group.

**Main flow**
1. Open Add expense.
2. Enter amount and choose category.
3. Keep date defaulted to today; optionally change it.
4. Optionally add description and payment method.
5. Submit.
6. Backend validates and saves.
7. UI confirms success and refreshes affected views.

**Alternates:** Invalid amount, missing category, inactive/foreign category, duplicate submit, server failure, expired session.

**Postconditions:** Exactly one expense record is created for a successful single submission; relevant totals update based on the approved date/group rules.

## UC-006 — Create an income entry

**Primary actor:** Authenticated user  
**Goal:** Record income received.

**Main flow:** User opens Add income, enters amount and approved required source/date fields, submits, and receives confirmation after successful persistence.

**Alternates:** Invalid amount/date, missing or inactive source where required, server failure, expired session.

**Open decisions:** Final required fields, whether an income source can be omitted, and whether future-dated income is permitted.

## UC-007 — Browse and filter transactions

**Primary actor:** Authenticated user  
**Goal:** Find previously recorded income and expenses.

**Main flow:** User opens Transactions, selects supported date/type/category filters, and browses a paginated result list.

**Alternates:** No records, no matches, invalid filter, record deleted, API error.

**Security:** Results include only records belonging to the current user.

**Open decisions:** Search by description, sort order, page size, and filter persistence.

## UC-008 — Edit a transaction

**Primary actor:** Authenticated user  
**Goal:** Correct a previously recorded entry.

**Preconditions:** Entry exists, is active, and belongs to the user.

**Main flow:** User opens entry, edits allowed fields, submits; backend revalidates and stores changes; affected totals refresh.

**Alternates:** Record changed/deleted elsewhere, validation failure, ownership mismatch, server failure.

**Security:** Backend derives user identity from the session, not a client-supplied user ID.

## UC-009 — Soft-delete and restore a transaction

**Primary actor:** Authenticated user  
**Goal:** Remove an incorrect entry from normal views while retaining recoverability.

**Main flow:** User confirms delete; backend marks record deleted; normal lists and calculations exclude it according to the approved rules. If restore is available, user restores it and normal calculations include it again.

**Open decisions:** Restore UI, retention duration, deletion of related data, and whether deletion is in MVP.

## UC-010 — Create or update a monthly plan

**Primary actor:** Authenticated user  
**Goal:** Plan expected income, savings target, and allocations to the four groups.

**Main flow:** User selects a month, edits planned values, reviews totals/warnings, saves, and sees the stored plan.

**Alternate:** Allocations plus savings target exceed planned income; missing income plan; invalid/negative values; concurrent update.

**Open decisions:** Whether over-allocation is warning-only or blocks save, unallocated amount definition, and whether group budgets must all be set.

## UC-011 — View insights

**Primary actor:** Authenticated user  
**Goal:** Understand patterns in recorded spending.

**Main flow:** System checks sufficient history, calculates only approved insight types, shows evidence/period, and explains when data is insufficient.

**Open decisions:** Exact regularity algorithm, minimum history, confidence thresholds, insight copy, and whether insights are in MVP.

## UC-012 — Complete a monthly reflection

**Primary actor:** Authenticated user  
**Goal:** Record a personal reflection on money choices for a month.

**Main flow:** User opens reflection, answers optional prompts, saves, and can review/edit according to approved retention rules.

**Open decisions:** Final questions, draft persistence, editing, and MVP inclusion.

## UC-013 — Manage categories

**Primary actor:** Authenticated user  
**Goal:** Use default categories and create/manage personal categories.

**Main flow:** User views available categories, adds a custom category, maps it to an approved Kakeibo group, and edits/deactivates it where allowed.

**Alternates:** Duplicate name, invalid group, category in use, concurrent change.

**Open decisions:** Exact default categories, duplicate policy, rename/deactivate behavior, and whether deleting categories is allowed.

## UC-014 — Manage income sources and preferences

**Primary actor:** Authenticated user  
**Goal:** Maintain labels used to plan and record income and manage basic preferences.

**Main flow:** User adds/edits/deactivates source labels and updates approved preferences.

**Open decisions:** Required preferences, duplicate rules, source lifecycle, and whether a source in use can be deactivated.

## UC-015 — Handle expired sessions and unauthorized access

**Primary actor:** Authenticated user  
**Goal:** Recover safely when a session expires or a record is unavailable.

**Main flow:** Backend rejects unauthenticated request; UI explains and routes to sign-in; after authentication, user returns to a safe route if possible.

**Security:** Cross-user resource requests must not reveal private record contents or existence.

## UC-016 — View and restore deleted records (if approved)

**Primary actor:** Authenticated user  
**Goal:** Recover a soft-deleted record.

**Preconditions:** Record is deleted and belongs to the user.

**Open decisions:** Whether this use case is included in MVP; deleted-item screen, retention period, and restore permission.
