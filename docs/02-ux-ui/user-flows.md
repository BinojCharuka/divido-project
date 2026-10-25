# User Flows

**Status:** Proposed — owner review required

## Flow 1 — First-time setup

**Goal:** A new user creates an account and establishes a usable monthly plan.

1. Open Create account.
2. Enter required authentication details.
3. Submit.
4. Backend validates and creates the account/session.
5. Route to onboarding.
6. Enter required profile/preferences (exact fields TBD).
7. Add one or more income sources and planned monthly income, if required by the approved onboarding rules.
8. Set monthly savings target.
9. Set allocations for Needs, Wants, Culture, and Unexpected.
10. Show a review screen with planned income, savings target, and allocations.
11. If planned allocations plus savings target exceed planned income, explain the difference and offer edit/continue behavior according to the approved business rule.
12. Complete setup and open Dashboard.

**Failure/recovery:** Invalid fields show inline messages; server failure preserves safe form input; duplicate account details show a non-sensitive message; session failure routes back to sign-in.

**Open decision:** Which onboarding steps are mandatory, skippable, or deferrable?

## Flow 2 — Record an expense

1. User chooses Add expense.
2. Form opens with date defaulted to today in the user's configured timezone.
3. User enters amount.
4. User selects a category; category must map to an approved group.
5. User optionally enters description and payment method.
6. User submits.
7. Frontend validates obvious field errors.
8. Backend validates amount, category ownership/availability, date, and session.
9. On success, show confirmation and refresh affected totals/list.
10. On failure, show actionable error and retain safe values.

**Required:** amount, category.  
**Optional:** description, payment method.  
**Default:** date = today.  
**TBD:** amount precision/maximum, future-date policy, and whether negative values are rejected at both UI and API.

## Flow 3 — Record income

1. User chooses Add income.
2. Enter amount and select income source if source selection is part of the approved data model.
3. Date defaults to today.
4. Optional description/note is entered if supported.
5. Submit.
6. Backend validates and stores the entry.
7. Dashboard and relevant month totals refresh.

**TBD:** final required fields, source-less income behavior, and income date restrictions.

## Flow 4 — Review and edit a transaction

1. Open Transactions.
2. Filter by type/date/category as supported.
3. Open a record.
4. Choose Edit.
5. Update permitted fields.
6. Save.
7. UI reflects the updated record and affected summaries.

If the record no longer exists or has been soft-deleted, show a safe not-found/deleted state. The backend must enforce ownership even if a user changes the URL or request payload.

## Flow 5 — Soft-delete and restore

1. Open a transaction.
2. Choose Delete.
3. Show confirmation with clear wording.
4. Confirm; record is soft-deleted.
5. Remove it from normal totals and normal lists according to the approved accounting rules.
6. If restore is supported in MVP, expose a clear deleted-items/restore path.
7. Restore returns it to normal calculations.

**TBD:** whether a dedicated deleted-items screen is in MVP and how long deleted records are retained.

## Flow 6 — Set a monthly plan

1. Open Budget.
2. Choose month.
3. Review planned income, savings target, and four group allocations.
4. Edit values.
5. Show total allocations and comparison with planned income.
6. If allocations plus savings target exceed planned income, show a warning.
7. Save according to the approved rule (warning-only versus blocking).
8. Refresh budget summary.

Do not label the plan as actual spending. Do not treat savings target as an actual transfer.

## Flow 7 — Review insights

1. Open Insights.
2. System checks available transaction history.
3. If enough data exists, show understandable observations and the relevant period.
4. Explain the basis of the observation where possible.
5. If insufficient data exists, show a helpful empty state explaining what kind of activity will enable future insights.
6. Do not present a proposed spending habit as a fact if confidence/criteria are not met.

**Known proposal:** 90-day lookback and at least three distinct spending days for a regularity candidate; exact algorithm and threshold remain TBD.

## Flow 8 — Monthly reflection

1. User opens Reflection or follows a monthly prompt.
2. Show a small set of approved reflection questions.
3. User may answer, skip individual questions, or leave and return if draft retention is supported.
4. Save answers with the relevant month.
5. Show a calm completion state and a route back to Dashboard.

**TBD:** final questions, persistence behavior, editability, and whether Reflection is in the MVP.

## Flow 9 — Session expiry

1. User makes a protected request.
2. Backend reports unauthenticated/expired session.
3. UI explains that the session expired.
4. Route to sign-in.
5. After successful sign-in, return to a safe destination where possible.

Never treat client-only route protection as authorization.

## Flow 10 — Empty states

- No transactions: explain how to add the first expense or income.
- No budget for month: offer to create the monthly plan.
- No insights: explain that more recorded activity is needed.
- No reflection: invite the user to begin or skip.
- No categories available: explain the issue and offer a safe recovery path; do not allow an invalid transaction submission.
