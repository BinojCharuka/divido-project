# Business Rules

**Status:** Proposed — owner review required  
**Important:** These rules are candidates for approval, not a frozen financial specification.

## 1. User and data ownership

### BR-001 — Individual ownership
Each user's personal records belong to that user. Every protected read and mutation must be scoped to the authenticated user on the server.

### BR-002 — Session-derived identity
The backend derives the acting user from the authenticated session. It must not trust a client-supplied user ID as proof of ownership.

## 2. Money and transactions

### BR-003 — Explicit transaction type
An entry is explicitly classified as income or expense. The UI and API must not infer type solely from a positive/negative amount.

### BR-004 — Amount validation
Amounts must follow an approved precision, scale, maximum, and sign policy. Negative or zero amounts must not be accepted until the product owner defines the intended behavior. Server-side validation is mandatory.

### BR-005 — Expense required fields
Expense amount and category are required. Date defaults to the current date in the user's configured timezone. Description and payment method are optional, subject to final API/data contracts.

### BR-006 — Income fields
Income amount and date are expected. Source requirement and optional notes must be confirmed before the API contract is frozen.

### BR-007 — Planned versus actual
Planned income and budget allocations are planning values; recorded income and expenses are actual entries. Do not combine or label them as the same measure.

### BR-008 — No account-balance implication
MVP shows one overall money picture and does not claim to know bank balances or individual account balances.

### BR-009 — No transfer implication
Saving an entry does not move money. A savings target is an intention/plan unless an explicit, separately approved feature exists.

### BR-010 — Date and month membership
Each transaction belongs to a calendar month based on its effective date in the approved user timezone. The treatment of date changes, timezone changes, and future-dated entries requires confirmation.

## 3. Kakeibo groups and categories

### BR-011 — Four group model
The proposed groups are Needs, Wants, Culture, and Unexpected. Final labels and explanatory copy require owner approval.

### BR-012 — Category maps to a group
Each active expense category maps to one approved group for classification and summary calculations. Whether group assignment can change later and how historical transactions are treated must be defined.

### BR-013 — Default and custom categories
The product is expected to provide predefined categories and allow users to create custom categories. Exact defaults, naming constraints, uniqueness scope, and deactivation behavior require approval.

### BR-014 — No silent reclassification
The system must not silently move a transaction to another group without a documented, user-visible rule.

## 4. Monthly plan and budget

### BR-015 — Monthly plan scope
A plan is associated with one user and one calendar month. Only one active plan per user/month is expected unless the owner approves versioning or multiple plans.

### BR-016 — Four group allocations
The proposed plan has separate allocations for Needs, Wants, Culture, and Unexpected. The rule for missing/zero allocations must be explicit.

### BR-017 — Over-allocation formula
Proposed check: `group allocation total + savings target > planned income`. When true, show the difference as an over-allocation warning. Whether save is blocked is TBD.

### BR-018 — Budget remaining formula
Proposed formula for a group: `group allocation − eligible recorded expenses in that group for the selected month`. The UI must show a negative/over-budget state if spending exceeds the allocation; do not clamp it to zero without showing the overage.

### BR-019 — Income totals
Recorded income for a period is the sum of eligible income entries in that period, excluding soft-deleted entries if soft deletion is approved.

### BR-020 — Expense totals
Recorded expense for a group/period is the sum of eligible active expense entries whose category maps to that group and whose effective date falls within the period.

### BR-021 — Calculation authority
Financial totals and authoritative budget calculations must be implemented or verified in the backend/service layer. Frontend may preview calculations but must not be the source of truth.

## 5. Soft deletion and lifecycle

### BR-022 — Soft deletion
If enabled, soft-deleted records are excluded from normal list responses and financial calculations. Their data remains stored until the approved retention/purge policy applies.

### BR-023 — Restore
If restore is enabled, only the record owner may restore their record. Restored records re-enter normal calculations once, not more than once.

### BR-024 — Related category/source lifecycle
Deleting or deactivating a category/source that is referenced by historical entries must not corrupt or erase those entries. Final lifecycle behavior requires owner approval.

## 6. Insights and reflection

### BR-025 — Insight lookback
A 90-day lookback is proposed for spending-pattern insights. The exact date boundaries, timezone handling, and calculation method are TBD.

### BR-026 — Minimum evidence
At least three distinct spending days is a proposed minimum for a regularity candidate, not a complete definition of a recurring habit. The final algorithm, thresholds, and wording must be approved and tested.

### BR-027 — No unsupported certainty
Insights must describe observations supported by available data. Do not imply causation, diagnosis, or guaranteed future behavior.

### BR-028 — Reflection is optional
Reflection answers should not be required to use core tracking functionality. Final questions and retention/edit rules are TBD.

## 7. Preferences and defaults

### BR-029 — Initial locale
English is proposed as the initial UI language.

### BR-030 — Currency and timezone
LKR and `Asia/Colombo` are proposed defaults. Whether currency/timezone are editable and how historical values are interpreted after changes requires approval.

## 8. Decisions required before implementation freeze

1. Authentication identifier, password policy, verification, recovery, and session expiry.
2. Amount precision, zero/negative values, maximum amount, and future dates.
3. Exact default category list and category/group mappings.
4. Whether category group mappings are editable after transactions exist.
5. Required fields for income.
6. Budget over-allocation save/block behavior.
7. Formula for unallocated income and treatment of missing allocations.
8. Soft-delete scope, restore UI, and retention.
9. Insight algorithm and minimum history.
10. Reflection inclusion, questions, and persistence.
11. Month navigation and timezone behavior.
12. Duplicate category/source rules.
