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

## 3. `categories` — existing table to inspect

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | Category identifier | Existing type | Inspect actual type |
| `user_id` | Owner for custom category | FK or nullable FK | Depends on global-default versus per-user-copy model |
| `name` | Category label | Text | Trim/normalize and enforce approved length |
| `group_key` | Kakeibo group | Enum/text | Proposed `NEEDS`, `WANTS`, `CULTURE`, `UNEXPECTED` |
| `is_default` | Whether predefined | Boolean | Exact model TBD |
| `is_active` | Whether selectable for new entries | Boolean | Lifecycle policy TBD |
| `created_at`, `updated_at` | Audit timestamps | Timestamp | If supported by existing conventions |

## 4. `income_sources` — proposed

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | Source identifier | UUID or existing convention | PK |
| `user_id` | Owner | FK | Required |
| `name` | Label, e.g. Salary | Text | Trimmed; length/uniqueness TBD |
| `is_active` | Selectable for new income | Boolean | Preserve historical references |
| `created_at`, `updated_at` | Audit timestamps | Timestamp | Server-generated |

## 5. `transactions` — proposed single-table option

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | Transaction identifier | UUID or existing convention | PK |
| `user_id` | Owner | FK | Required; set by backend session context |
| `type` | `INCOME` or `EXPENSE` | Enum/text | Required; do not infer from sign |
| `amount` | Money amount | `NUMERIC(p,s)` | Positive-only is proposed; exact scale/max TBD |
| `transaction_date` | Effective calendar date | `DATE` | Timezone/month semantics must be approved |
| `category_id` | Expense category | FK, nullable for income | Required for expense; exact constraints depend on model |
| `income_source_id` | Income source | FK, nullable for expense | Required only if approved |
| `description` | Optional note | Text | Length limit TBD |
| `payment_method` | Optional manual label | Enum/text | Exact allowed values TBD |
| `created_at`, `updated_at` | Audit timestamps | Timestamp | Server-generated |
| `deleted_at` | Soft-delete instant | Nullable timestamp | Only if soft deletion is approved |

If one table is selected, add domain validation and possibly database check constraints so type/category/source combinations are valid. SQL check constraints cannot enforce all cross-table ownership conditions by themselves.

## 6. `monthly_plans` — proposed

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | Plan identifier | UUID | PK |
| `user_id` | Owner | FK | Required |
| `month` | Calendar month | `DATE` first-of-month or integer year/month | Choose one representation |
| `planned_income` | Expected income | `NUMERIC(p,s)` | Scale/max TBD |
| `savings_target` | Intended savings | `NUMERIC(p,s)` | Not an actual transfer |
| `created_at`, `updated_at` | Audit timestamps | Timestamp | Server-generated |
| `version` | Optimistic-lock field | Integer | Optional; useful if concurrent edits matter |

Proposed uniqueness: one plan per user/month. If approved, enforce with a database unique constraint.

## 7. `monthly_group_budgets` — proposed

| Logical field | Meaning | Candidate type | Rules / notes |
|---|---|---|---|
| `id` | Row identifier | UUID | PK, or composite key if chosen |
| `monthly_plan_id` | Parent plan | FK | Required |
| `group_key` | One of four Kakeibo groups | Enum/text | Required |
| `allocated_amount` | Planned allocation | `NUMERIC(p,s)` | Scale/max TBD |
| `created_at`, `updated_at` | Audit timestamps | Timestamp | Optional per convention |

Proposed uniqueness: `(monthly_plan_id, group_key)` so one group cannot have duplicate allocation rows.

## 8. `user_preferences` — proposed if separate table

Candidate fields: `user_id` (PK/FK), `locale`, `currency_code`, `time_zone`, `created_at`, `updated_at`.

Do not create this table if approved design keeps these settings on `app_users`.

## 9. `reflections` — optional proposed entity

Candidate fields: `id`, `user_id`, `month`, `answers` (structured JSON or normalized child rows), `question_version`, `created_at`, `updated_at`.

Choose JSON versus normalized answers based on querying, validation, retention, and question-versioning needs. Avoid storing reflection content in logs.

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
