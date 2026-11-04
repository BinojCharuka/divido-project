# Database Schema Overview

**Status:** Conceptual model — not a migration specification. Set 6 will define the data dictionary and exact schema.

## 1. Existing database facts to verify

Project context indicates PostgreSQL already contains `app_users`, `categories`, and `flyway_schema_history`, and that `V1__init.sql` has been applied. Verify the actual schema and migration status before making changes. Do not infer column names or constraints from these table names alone.

## 2. Proposed logical entities

| Entity | Purpose | Key relationships |
|---|---|---|
| `app_users` | Account identity and authentication-related fields | Owns user preferences and personal records |
| `user_preferences` (candidate) | Locale, currency/timezone or approved settings | One user |
| `categories` | Default and/or custom expense categories and group mapping | Custom categories belong to a user; exact default-category ownership model TBD |
| `income_sources` (candidate) | Labels used to plan/record income | Belongs to a user |
| `transactions` (candidate) | Recorded income and expenses | Belongs to a user; expense may reference category; income may reference source |
| `monthly_budgets` (V4, implemented) | Per-month planned income, savings target and the four group allocations | Belongs to a user; `UNIQUE (user_id, budget_month)` |
| `reflections` (candidate) | Optional month-specific reflection answers | Belongs to a user and month |
| `flyway_schema_history` | Flyway-managed migration metadata | Managed by Flyway |

Names are conceptual candidates. Match established names and conventions in the existing schema before writing migrations.

## 3. Relationship sketch

```text
app_users
  ├── user_preferences (candidate)
  ├── custom categories
  ├── income_sources
  ├── transactions
  ├── monthly_budgets (one per month; four allocation columns)
  └── reflections (if approved)

transactions ── optional category reference
transactions ── optional income-source reference for income (TBD)
```

The exact transaction table design (single table with a type, or separate income/expense tables) is an architecture decision to make before Set 5/6 is frozen. Do not create both approaches.

## 4. Integrity requirements

- Every user-owned row has a clear ownership path.
- Foreign keys prevent orphaned child rows where appropriate.
- User/month uniqueness is enforced if one plan per month is approved.
- Category uniqueness scope is defined before adding a unique index.
- Amount precision and allowed values are constrained according to approved money rules.
- Deletion/lifecycle fields are consistent with the soft-delete policy if approved.
- Timestamps and date-only values are chosen intentionally.
- Queries are indexed for authenticated user + date/month access patterns.

## 5. Important schema decisions

Resolve before final schema/API contract:
1. Existing `app_users` and `categories` columns and constraints.
2. Default categories shared globally versus copied per user.
3. Single transactions table versus separate income/expense tables.
4. Date-only transaction date versus timestamp.
5. Decimal precision/scale and maximum amount.
6. Soft-delete fields and retention/purge behavior.
7. Monthly plan uniqueness and versioning.
8. How historical transactions behave if category group mappings change.
9. Whether reflection data is in MVP and how it is retained.
10. Whether preferences need a separate table or fields on `app_users`.

## 6. Migration safety

- Never edit an applied migration.
- Add a new Flyway migration for schema changes.
- Test migrations against a clean database and an upgrade from the current schema.
- Review generated SQL and indexes before merging.
- Avoid destructive changes without an explicit data migration and owner approval.
