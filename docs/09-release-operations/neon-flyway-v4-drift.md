# Neon Flyway V4 Drift — Phase 03 Recovery Runbook

**Status:** Operational plan only. Production repair/migration has not been executed.

## 1. Observed production state

Read-only inspection of Neon project `divido`, branch `production`, database `neondb` on 2026-11-04 found:

- Flyway versions 1–4 are marked successful.
- V4 history is `V4__budgets_reflections_profile.sql`, description `budgets reflections profile`, checksum `50311058`.
- The current `main` repository instead contains `V4__monthly_budgets.sql`; this is a version-4 script identity/checksum mismatch.
- Production contains legacy `budgets` and `monthly_reflections` tables and `app_users.locale` / `app_users.onboarding_complete` columns.
- At inspection, `budgets` had 0 rows, `monthly_reflections` had 1 row, and `monthly_budgets` did not exist.
- A disposable Neon branch successfully created and inspected the Phase 03 `monthly_budgets` schema. No production DDL was executed.

The legacy V4 objects and their data are retained. They are not dropped, renamed, copied, or rewritten by V5.

## 2. Why V5 is compatibility-safe

`V4__monthly_budgets.sql` remains unchanged in this PR. It creates `monthly_budgets` on a fresh database. The new `V5__monthly_budgets.sql` uses `CREATE TABLE IF NOT EXISTS` to handle both schema histories:

- On the existing production database, V5 creates the missing `monthly_budgets` table.
- On a fresh database, V4 has already created it; V5 skips the create. The post-migration catalog checks below verify the expected shape.
- The old production `budgets`, `monthly_reflections`, and profile columns remain untouched.

This compatibility migration is intentional. Do not simplify it to an unconditional `CREATE TABLE`, and do not rename/rewrite applied V1–V4 migration files.

## 3. Production preflight — required before any repair

Do this in a planned maintenance window with the application migration/startup path paused. Take/verify a Neon restore point or backup first.

1. Confirm the target is project `divido`, branch `production`, database `neondb`.
2. Confirm the production V4 row still has version `4`, script `V4__budgets_reflections_profile.sql`, checksum `50311058`, and `success = true`.
3. Run `flyway info` using the exact migration directory from this commit and the Flyway CLI version aligned with the Flyway library version resolved by the backend build.
4. Confirm V4 is the only migration identity/checksum mismatch, there are no failed migration rows, and V5 is the only pending migration.
5. Re-check the legacy tables/columns and row counts. In particular, do not proceed if `monthly_reflections` has changed unexpectedly or if an unexpected `monthly_budgets` table already exists.
6. If any condition differs, stop. Do not run `repair` or `migrate` until the drift is investigated.

## 4. Controlled Flyway repair and migration

Flyway `repair` changes schema-history metadata; it does not execute the V4 SQL and does not make the production schema match a migration by itself. It may also remove failed migration records, which is why the preflight explicitly requires none.

After the preflight is reviewed and separately approved by the project owner:

1. Configure the Flyway CLI with the production direct (non-pooled) JDBC URL, role and secret through environment variables/secret manager. Never commit credentials or paste them into shell history.
2. Run `flyway info` and retain the output for the change record.
3. Run `flyway repair` against `backend/src/main/resources/db/migration`. This aligns the already-applied V4 history row's description/checksum with the current repository's V4 script identity; it does **not** execute V4.
   The row's `script` column keeps the value `V4__budgets_reflections_profile.sql` after repair; only `description` and `checksum` change. This is expected, so do not treat it as a failed repair or edit it by hand. A disposable-database rehearsal of this behavior is in `LegacyProductionHistoryMigrationTest`.
4. Run `flyway info` again. Confirm V1–V4 are applied/validated and V5 is pending.
5. Run `flyway migrate` once. V5 creates `monthly_budgets` on this production schema.
6. Run the post-migration verification queries below before restoring application traffic.

Do not run repair and migrate automatically as part of an ordinary application startup. Keep the deployment migration step explicit and supervised for this recovery.

## 5. Post-migration verification

Verify all of the following on the production branch:

- `flyway_schema_history` shows successful versions 1–5, with V5 script `V5__monthly_budgets.sql`.
- `monthly_budgets` has all 11 expected columns, six `NUMERIC(12,2)` money columns, the user FK, the first-day check and `UNIQUE (user_id, budget_month)`.
- `budgets` and `monthly_reflections` still exist; their row counts match the preflight snapshot unless application traffic was deliberately resumed.
- The pre-existing reflection record remains present.
- Backend starts with Hibernate `ddl-auto: validate`; budget GET/PUT and dashboard requests pass a smoke test against a dedicated test user.
- No production test writes are made against real user financial records.

### SQL checks (read-only)

```sql
-- Applied migration history
SELECT installed_rank, version, description, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;

-- Required monthly_budgets columns and money precision
SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'monthly_budgets'
ORDER BY ordinal_position;

-- Required primary, unique, check and foreign-key constraints
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.monthly_budgets'::regclass
ORDER BY conname;

-- Confirm legacy tables remain and compare their counts to the preflight record
SELECT 'budgets' AS table_name, count(*) AS row_count FROM public.budgets
UNION ALL
SELECT 'monthly_reflections', count(*) FROM public.monthly_reflections
UNION ALL
SELECT 'monthly_budgets', count(*) FROM public.monthly_budgets;
```

## 6. Recovery rules

- Never delete or edit Flyway history rows by hand.
- Never drop the legacy `budgets` or `monthly_reflections` tables as part of this task.
- Never rerun V1–V4 SQL on production.
- If V5 fails, leave the legacy objects intact, keep application traffic paused if startup/validation is affected, capture the error, and investigate. Do not manually mark V5 successful.
- Any rollback must use a verified Neon restore point or a reviewed forward-only corrective migration; do not drop `monthly_budgets` casually.
- Phase 03 tasks remain `MERGED — VERIFICATION PENDING` until production schema verification and post-merge `main` test execution are evidenced.
