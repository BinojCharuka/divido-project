# Data Dictionary

**Status:** Proposed field catalogue — reconcile with actual DDL and approved requirements before implementation.

This document describes candidate logical fields, not guaranteed column names. Existing tables must be inspected before creating migrations.

## 1. Conventions

- Primary identifiers: UUID is proposed; verify existing identifier types.
- Timestamps: store instants consistently (typically UTC) and render using the approved user timezone.
- Transaction date and monthly-plan month may be date-only/calendar fields rather than timestamps.
- Money: use PostgreSQL `NUMERIC`/`DECIMAL` and Java `BigDecimal`; precision and scale are TBD.
- User-owned records: include or derive ownership in a way that every query can enforce.
- Enum values are stable internal values; display labels are handled by the UI.
- Never store formatted currency strings such as `LKR 1,250.00` as canonical money data.

## 2. `app_users` — existing table to inspect

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | User identifier | Existing type | Inspect DDL; do not assume UUID |
| `email` or login identifier | Authentication identifier | Text | Final identifier TBD; unique normalized form if email chosen |
| `password_hash` | One-way credential hash | Text | Only if password auth is used; never expose |
| `created_at` | Account creation instant | Timestamp | Server-generated |
| `updated_at` | Last update instant | Timestamp | Server-generated if present |
| `status` | Account state | Enum/text | Only if required by approved auth/account lifecycle |

Do not add duplicate fields if the existing schema already models them under different names.

**Added in `V7__account_lifecycle.sql` (DIV-022, DIV-023, DIV-029):**

| Column | Meaning | Type | Rules |
|---|---|---|---|
| `onboarding_completed_at` | When onboarding was finished or skipped (`DEC-044`) | `TIMESTAMPTZ` | `NULL` = not yet. Backfilled to `created_at` for accounts that existed at V7. Set once. |
| `credentials_version` | Password generation (`DEC-043`, `DEC-045`) | `INTEGER` | `NOT NULL DEFAULT 0`, `CHECK >= 0`. Incremented on every password change or reset; a session signed in with an older value is ended on its next request. |

The production database also has legacy `app_users.onboarding_complete` and `app_users.locale` columns from the earlier V4 ([neon-flyway-v4-drift.md](../09-release-operations/neon-flyway-v4-drift.md)). V7 uses different names on purpose and the application never reads the legacy columns.

`display_name` (V1, `NOT NULL`, 1–100 characters) is now editable through PROFILE-002 (`DEC-043`).

## 2a. `password_reset_tokens` — implemented (V7, DIV-029)

| Column | Meaning | Type | Rules |
|---|---|---|---|
| `id` | Primary key | `UUID` | `DEFAULT gen_random_uuid()` |
| `user_id` | Account | `UUID` | `NOT NULL`, FK `app_users(id) ON DELETE CASCADE`; indexed |
| `token_hash` | SHA-256 of the emailed token | `CHAR(64)` | `NOT NULL`, `UNIQUE`, `CHECK ~ '^[0-9a-f]{64}$'`. The token itself is never stored. |
| `expires_at` | 30 minutes after creation (`DEC-045`) | `TIMESTAMPTZ` | `NOT NULL`; compared with the application clock |
| `used_at` | When the token was consumed | `TIMESTAMPTZ` | `NULL` until used; set atomically |
| `created_at` | Creation instant | `TIMESTAMPTZ` | Set from the application clock |

At most one row per account: a new request deletes earlier rows. A successful reset deletes all rows of the account.

## 3. `categories` — existing table (`V1__init.sql`, extended in `V2__categories_and_income_sources.sql`)

| Field | Meaning | Type | Rules / notes |
|---|---|---|---|
| `id` | Category identifier | `UUID` | Primary key (`gen_random_uuid()`) |
| `user_id` | Owner for custom category | `UUID` (nullable FK) | `NULL` for the 3 global default categories; references `app_users(id)` for user-owned custom categories (`DEC-013`) |
| `name` | Category label | `VARCHAR(100)` | Required |
| `slug` | Normalized url/code slug | `VARCHAR(100)` | Required; server-generated lowercase kebab-case with counter suffix on duplicates |
| `category_type` | Kakeibo group | `VARCHAR(20)` | `CHECK (category_type IN ('NEED', 'WANT', 'CULTURE', 'UNEXPECTED'))` |
| `is_active` | Whether selectable for new entries | `BOOLEAN` | Added in V2; default `TRUE` |
| `created_at` | Audit timestamp | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |
| `updated_at` | Last updated timestamp | `TIMESTAMPTZ` | Added in V2; default `CURRENT_TIMESTAMP` |

## 4. `income_sources` — implemented table (`V2__categories_and_income_sources.sql`)

| Field | Meaning | Type | Rules / notes |
|---|---|---|---|
| `id` | Source identifier | `UUID` | Primary key (`gen_random_uuid()`) |
| `user_id` | Owner | `UUID` (FK) | Required; references `app_users(id) ON DELETE CASCADE` |
| `name` | Label, e.g. Salary | `VARCHAR(100)` | Required; trimmed; unique per user |
| `is_active` | Whether selectable for new entries | `BOOLEAN` | Default `TRUE` |
| `created_at` | Audit timestamp | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |
| `updated_at` | Last updated timestamp | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |

## 5. `transactions` — implemented in `V3` migration (`DIV-011`)

| Field | Meaning | Type | Rules / notes |
|---|---|---|---|
| `id` | Transaction identifier | `UUID` | Primary key (`gen_random_uuid()`) |
| `user_id` | Owner | `UUID` (FK) | Required; references `app_users(id) ON DELETE CASCADE` |
| `type` | `INCOME` or `EXPENSE` | `VARCHAR(20)` | Required; `CHECK (type IN ('INCOME', 'EXPENSE'))` |
| `amount` | Money amount | `NUMERIC(12,2)` | Required; positive values only (`amount > 0`) |
| `transaction_date` | Effective calendar date | `DATE` | Required; user timezone date |
| `category_id` | Expense category | `UUID` (FK) | Required for `EXPENSE`; references `categories(id) ON DELETE RESTRICT` (`DEC-013`). Must be NULL for `INCOME` |
| `income_source_id` | Income source | `UUID` (FK) | Optional for `INCOME` (`DEC-003`); references `income_sources(id) ON DELETE RESTRICT`. Must be NULL for `EXPENSE` |
| `description` | Optional note | `VARCHAR(500)` | Optional |
| `payment_method` | Optional manual label | `VARCHAR(50)` | Optional |
| `created_at` | Created timestamp | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |
| `updated_at` | Last updated timestamp | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |

*Constraints:*
- `chk_transactions_type`: `type IN ('INCOME', 'EXPENSE')`
- `chk_transactions_amount`: `amount > 0`
- `chk_transactions_type_references`: `(type = 'EXPENSE' AND category_id IS NOT NULL AND income_source_id IS NULL) OR (type = 'INCOME' AND category_id IS NULL)`

*Indexes:*
- `idx_transactions_user_date`: `(user_id, transaction_date DESC, created_at DESC)`
- `idx_transactions_user_type_date`: `(user_id, type, transaction_date DESC, created_at DESC)`
- `idx_transactions_category_id`: `(category_id)`
- `idx_transactions_income_source_id`: `(income_source_id)`

*Note on deletion:* No `deleted_at` column is present. `DEC-014` approved hard delete (`DELETE /api/v1/transactions/{id}` permanently deletes the row and returns `204 No Content`). Foreign keys to categories and income sources use `ON DELETE RESTRICT` to preserve historical financial integrity.

## 6. `monthly_budgets` — IMPLEMENTED (Flyway `V4__monthly_budgets.sql`, DIV-025)

One row per user per calendar month (DEC-028). Holds the plan and all four group allocations in one row, replacing the earlier proposal of separate `monthly_plans` and `monthly_group_budgets` tables.

| Column | Meaning | Type | Rules / notes |
|---|---|---|---|
| `id` | Row identifier | `UUID` | PK, `gen_random_uuid()` |
| `user_id` | Owner | `UUID` | `NOT NULL`, FK `app_users(id) ON DELETE CASCADE` |
| `budget_month` | Calendar month | `DATE` | First day of the month; `CHECK (EXTRACT(DAY FROM budget_month) = 1)` |
| `planned_income` | Expected income (planned, not recorded) | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0` |
| `savings_target` | Intended savings | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0`; not a transfer or balance |
| `needs_allocation` | NEEDS group budget | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0` |
| `wants_allocation` | WANTS group budget | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0` |
| `culture_allocation` | CULTURE group budget | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0` |
| `unexpected_allocation` | UNEXPECTED group budget | `NUMERIC(12,2)` | `NOT NULL`, `CHECK >= 0` |
| `created_at`, `updated_at` | Audit timestamps | `TIMESTAMPTZ` | Database defaults; `updated_at` set by the upsert |

Constraint `uq_monthly_budgets_user_month UNIQUE (user_id, budget_month)`; its index serves the per-user lookup. Writes use `INSERT … ON CONFLICT ON CONSTRAINT uq_monthly_budgets_user_month DO UPDATE` (last write wins; no version column). Derived figures (totals, over-allocation) are not stored; `BudgetCalculator` computes them.

## 7. (removed) `monthly_group_budgets`

Superseded by the four allocation columns in `monthly_budgets` (DIV-025).

## 8. (not created) `user_preferences`

Not needed: currency, timezone and language are fixed for the MVP (`DEC-043`) and are not stored per user.

## 9. `reflections` and `reflection_answers` — implemented (V6, DIV-028)

Flyway `V6__reflections.sql`. Decisions: DEC-034 (questions), DEC-035 (length), DEC-036 (new table beside the legacy production `monthly_reflections`, which is untouched), DEC-038 (lifecycle), DEC-039 (version check), DEC-040 (blank and future months).

`reflections` — one row per user and calendar month:

| Column | Meaning | Type | Rules |
|---|---|---|---|
| `id` | Primary key | `UUID` | `DEFAULT gen_random_uuid()` |
| `user_id` | Owner | `UUID` | `NOT NULL`, FK `app_users(id) ON DELETE CASCADE` |
| `reflection_month` | First day of the month | `DATE` | `NOT NULL`, `CHECK` day = 1 |
| `question_set_version` | Question set answered | `SMALLINT` | `NOT NULL`, `CHECK >= 1`; currently 1 |
| `version` | Optimistic lock (DEC-039) | `INTEGER` | `NOT NULL DEFAULT 1`, `CHECK >= 1`; +1 on every edit |
| `created_at`, `updated_at` | Audit timestamps | `TIMESTAMPTZ` | Database defaults; `updated_at` set on edit |

Constraint `uq_reflections_user_month UNIQUE (user_id, reflection_month)`. A first save uses `INSERT … ON CONFLICT DO NOTHING RETURNING id`; an edit uses `UPDATE … WHERE version = :expected RETURNING id`. No row back means `409 REFLECTION_CONFLICT`.

`reflection_answers` — one row per answered question:

| Column | Meaning | Type | Rules |
|---|---|---|---|
| `reflection_id` | Parent | `UUID` | `NOT NULL`, FK `reflections(id) ON DELETE CASCADE` |
| `question_id` | Approved question id | `VARCHAR(50)` | `NOT NULL`; allowed ids are checked by the service per question set |
| `answer` | Answer text, trimmed | `TEXT` | `NOT NULL`, `CHECK char_length BETWEEN 1 AND 2000`, `CHECK btrim(answer) <> ''` |

Primary key `(reflection_id, question_id)`. Answer text is sensitive: never logged, never analysed, never returned by the history list.

## 10. Cross-entity constraints and indexes

Candidates to evaluate:
- Unique normalized login identifier.
- Unique user/month for monthly plans.
- Unique plan/group for allocations.
- User-scoped category/source uniqueness if required.
- Index transactions by `(user_id, transaction_date)` and possibly `(user_id, type, transaction_date)`.
- Index child rows by foreign keys used in joins.
- Foreign keys with deliberate delete behavior; avoid cascading deletion of financial history unintentionally.
- Constraints for positive amounts and valid transaction type/group values once approved.

Index and constraint names must follow the actual project convention and be checked against existing indexes before migration.
