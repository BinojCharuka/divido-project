# Database Migration Policy

**Status:** Required development rule

## 1. Core rule

**Applied Flyway migrations are immutable.** Once a migration has run in a shared, staging, or production database, do not edit, rename, reorder, or delete it. Add a new migration for every later schema change.

The project context indicates `V1__init.sql` is already applied. Verify Flyway history and preserve V1 exactly.

## 2. Migration naming

Use the project's existing Flyway naming convention. Proposed examples:

```text
V2__add_income_sources.sql
V3__add_transactions.sql
V4__add_monthly_plans.sql
```

Do not assume these exact versions are free; inspect the repository and database history first. If V2 already exists, use the next available version consistent with the project's convention.

## 3. Migration workflow

1. Inspect current migration files and `flyway_schema_history`.
2. Inspect actual PostgreSQL DDL, indexes, constraints, and column types.
3. Agree the logical data model and API dependencies.
4. Create the next migration file with a narrow, coherent change.
5. Review SQL manually.
6. Run migration against a clean disposable test database.
7. Run migration from a copy/fixture matching the current schema version.
8. Verify resulting schema, constraints, and indexes.
9. Run backend tests and application startup.
10. Commit migration and matching entity/repository/tests/docs together.

## 4. Shared development database safety

- Never run destructive DDL against a shared database without review and backup/restore plan.
- Do not manually modify Flyway history to force a migration to rerun.
- Do not use `flyway clean` on a shared or production database.
- Do not rely on Hibernate `ddl-auto=update` in shared/staging/production.
- Use synthetic data for migration tests.
- If a migration fails, inspect the failure and actual database state before retrying; do not blindly delete history rows.

## 5. Backward compatibility

For changes used by a deployed frontend/backend pair, prefer expand-and-contract:
1. Add compatible nullable column/table/index.
2. Deploy code that can work with old and new shapes where necessary.
3. Backfill data safely if needed.
4. Add stricter constraints only after data satisfies them.
5. Remove obsolete structures only in a later reviewed migration.

For an early local-only MVP, coordination may be simpler, but migration history still must remain reproducible.

## 6. Data migration and rollback

- Document whether a migration is reversible and how.
- For destructive or lossy changes, require explicit owner approval and verified backup.
- Flyway rollback is not assumed; write a forward-fix migration when appropriate.
- Test both schema migration and data transformation.
- Record operational steps for large table changes.

## 7. Review checklist

- [ ] Version/name follows existing convention.
- [ ] Applied migrations unchanged.
- [ ] Constraints and indexes are intentional.
- [ ] Foreign-key delete behavior is safe.
- [ ] Money types use decimal-safe numeric.
- [ ] User ownership is represented and enforced.
- [ ] Migration works on clean and upgraded databases.
- [ ] Related entities, DTOs, API docs, and tests are updated.
- [ ] No secrets or real personal data in migration fixtures.
