# Acceptance Criteria

**Status:** Proposed — owner review required  
**Format:** Given / When / Then where practical

## Account and session

### AC-001 — Valid registration
Given a visitor enters valid approved registration details, when they submit, then the backend creates one account and establishes a session only if both operations succeed.

> **Superseded in part by `DEC-025` (APPROVED, 2026-10-28):** registration creates the account but no session. The session is established by sign-in (AC-003).

### AC-002 — Invalid or duplicate registration
Given required fields are missing/invalid or the identifier conflicts with an existing account, when submitted, then the system returns a safe validation response and does not create duplicate accounts.

### AC-003 — Valid sign-in
Given a registered user provides valid credentials, when they submit, then the backend establishes a valid session and routes them to a safe intended page.

### AC-004 — Sign-out invalidates session
Given an authenticated user signs out, when the request succeeds, then the server invalidates the session and subsequent protected requests are unauthenticated.

### AC-005 — Onboarding progress
Given an authenticated user has incomplete setup, when they enter the app, then the app directs them to the next required setup step according to approved onboarding rules; completed values are not silently overwritten.

## Expense entry

### AC-006 — Create valid expense
Given an authenticated user submits a valid amount, active category, valid date, and optional fields, when the backend accepts the request, then exactly one expense record is stored for that successful request and the response identifies the created record.

### AC-007 — Required fields
Given amount or category is missing/invalid, when the user submits, then the UI identifies the field and the backend rejects the invalid request.

### AC-008 — Category and ownership validation
Given a category is inactive, unavailable, or belongs to another user, when an expense is submitted, then the backend rejects it without disclosing private details.

## Income entry

### AC-009 — Create valid income
Given an authenticated user submits an income entry with all approved required fields, when the backend accepts it, then exactly one income record is stored and actual income summaries can include it according to the selected period.

## Transactions

### AC-010 — User sees only own records
Given a user requests the transaction list, when the backend responds, then every returned record belongs to that authenticated user.

### AC-011 — Filters and empty results
Given valid filters are supplied, when the user searches, then only matching own records are returned; if none match, the UI shows a clear empty-result state rather than a generic failure.

### AC-012 — Edit owned active record
Given an active record belongs to the authenticated user, when valid edits are submitted, then the record is updated and affected summaries use the updated values.

### AC-013 — Soft-delete excludes normal calculations
Given a user confirms deletion of an owned active record and soft deletion is approved, when deletion succeeds, then the record is omitted from normal lists and applicable totals while its stored data remains recoverable according to the retention policy.

### AC-014 — Restore record
Given a record is soft-deleted and restore is approved, when its owner restores it, then it reappears in normal views and applicable totals include it exactly once.

## Dashboard and budget

### AC-015 — Distinguish planned and actual values
Given a dashboard contains plan and activity data, when it renders, then planned income, recorded income, savings target, budgets, and spending are labeled clearly and include the relevant period.

### AC-016 — Empty dashboard
Given the user has no plan or no transaction history, when Dashboard loads, then it shows an appropriate setup/add-entry empty state and does not fabricate financial values.

### AC-017 — Monthly plan calculation
Given a valid month plan is submitted, when it is saved, then planned income, savings target, and each group allocation are stored for the correct user and month, according to the approved schema.

### AC-018 — Over-allocation warning
Given the sum of group allocations plus savings target exceeds planned income, when the plan is reviewed or edited, then the UI shows the calculated difference and a clear warning; save/block behavior follows the approved decision.

## Insights and reflection

### AC-019 — Insufficient insight history
Given the available history does not meet approved insight criteria, when Insights loads, then no unsupported pattern is presented as a fact and the UI explains that more data is needed.

### AC-020 — Insight transparency
Given an insight is displayed, when the user reviews it, then the observation period and an understandable basis are available and the wording avoids unsupported causal claims or shame.

### AC-021 — Save reflection
Given reflection is included in the approved MVP and the user submits valid answers, when save succeeds, then answers are associated with the authenticated user and intended month; skipped optional answers remain allowed.

## Categories and income sources

### AC-022 — Create custom category
Given a user submits a valid category name and approved group mapping, when save succeeds, then the category is associated with that user and available to them according to category rules.

### AC-023 — Reject invalid or conflicting category
Given a category name violates approved validation or uniqueness rules, when submitted, then the backend returns a field-level error and does not create an invalid duplicate.

### AC-024 — Manage income source
Given a user creates or updates an income source, when save succeeds, then it is available only to that user and existing historical records remain consistent with the approved lifecycle rules.

### AC-025 — Update preferences
Given a user changes an approved preference, when save succeeds, then subsequent UI behavior uses the stored value and validates it against supported options.

## Security and resilience

### AC-026 — Expired session
Given a protected request has no valid session, when the backend receives it, then it rejects the request using the documented unauthenticated response and the UI offers sign-in recovery.

### AC-027 — Cross-user read isolation
Given User A attempts to read User B's record by changing an ID or query parameter, when the backend processes the request, then it does not return User B's private data.

### AC-028 — Cross-user mutation isolation
Given User A attempts to edit, delete, restore, or otherwise mutate User B's record, when the backend processes the request, then the operation is rejected and no data changes occur.

## General completion criteria

### AC-029 — Validation is server-enforced
Given a client bypasses frontend validation, when it submits invalid data directly to the API, then backend validation still rejects it.

### AC-030 — Duplicate submission protection
Given a user submits a form and the request is still processing, when they activate submit again, then the UI prevents accidental repeat submission; backend idempotency behavior, if required, is specified in the API contract.

### AC-031 — Accessible form errors
Given a form submission has validation errors, when errors are displayed, then each error is associated with its field and available to keyboard and assistive-technology users.

### AC-032 — No false success
Given a request fails or its outcome is unknown, when the UI receives no confirmed success response, then it must not display a success state or clear user-entered values as if the save completed.

### AC-033 — Neutral reset request
Given anyone submits a well-formed email on the forgot-password page, when the request is accepted, then the same message is shown whether or not an account exists; for an account, one email with a single-use link valid for 30 minutes is sent, and earlier links stop working (`DEC-045`).

### AC-034 — Reset with a link
Given a valid, unused, unexpired reset link, when the user sets a new password of 8–72 characters, then the password changes, the link stops working, every session of the account ends, and the user is sent to sign in. An invalid, expired or used link shows one neutral message with a way to request a new link.

### AC-035 — Delete account
Given a signed-in user enters their password and types `DELETE`, when they confirm, then the account and all its data are deleted at once, the session ends, and the sign-in page says the account was deleted. A wrong password or confirmation deletes nothing (`DEC-046`).
