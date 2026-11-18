# Neon V6 Reflections Rollout — Phase 04 Production Runbook

**Status:** PROPOSED — not yet run. Owner supervision required.
**Applies to:** `backend/src/main/resources/db/migration/V6__reflections.sql`, merged to `main` in PR #28 (squash commit `ac5033d`, 2026-11-16), for DIV-028.
**Previous runbook:** [`neon-flyway-v4-drift.md`](neon-flyway-v4-drift.md) (V4 repair and V5; production verified 2026-11-16).

## 1. What V6 does

V6 adds two new tables and changes nothing that already exists:

- `reflections`: one row per user and month. It has `UNIQUE (user_id, reflection_month)`, a check that the month is stored as its first day, an optimistic `version`, and a foreign key to `app_users(id)` with `ON DELETE CASCADE`.
- `reflection_answers`: one row per answered question. Its primary key is `(reflection_id, question_id)`. Answers must be 1–2,000 characters and not blank. It cascades from `reflections`.

V6 does not touch the legacy production table `monthly_reflections` (DEC-036). It drops, renames or reads nothing.

V6 uses plain `CREATE TABLE` without `IF NOT EXISTS`, on purpose. If a table named `reflections` or `reflection_answers` already exists, the migration fails instead of reusing it. On a clean database and on the production-like legacy history, this is tested in `LegacyProductionHistoryMigrationTest`.

## 2. Important: the backend applies migrations at startup

`application.yml` sets `spring.flyway.enabled: true` and `jpa.hibernate.ddl-auto: validate`. Two consequences:

- **The first backend build from `main` at or after `ac5033d` that starts against production runs V6 automatically.** If production deploys from `main` automatically, V6 may already be applied. Do the read-only preflight (Section 3) before anything else, and do not assume it is still pending.
- **If the new backend starts and V6 fails**, Flyway stops startup. That backend version will not serve traffic. Flyway's own transaction rolls back the failed V6 on PostgreSQL, so no partial tables remain.
- **If the old backend (before `ac5033d`) runs against a database with V6 applied**, it still works. Its Hibernate validation only checks the entities it knows about, and the new tables are extra. So applying V6 before deploying the new backend is safe.

## 3. Read-only preflight

Run with a read-only or least-privilege role where possible. Confirm a Neon backup or restore point first.

1. Confirm the target is project `divido`, branch `production`, database `neondb`, using the direct (non-pooled) endpoint.
2. Run `flyway info` with the Flyway CLI version that matches `flyway-core` in the backend build (12.4.0 at the 2026-11-16 check). Point it at `backend/src/main/resources/db/migration` from `main` at `ac5033d` or later.
3. Run the SQL in Section 6 (the "Preflight" block).
4. Decide based on what you find:

| State found | Action |
|---|---|
| Versions 1–5 successful, V6 pending, no `reflections` or `reflection_answers` table, no failed rows | Go to Section 4 |
| V6 already successful | Skip Section 4; go straight to Section 5 and record who applied it and when |
| A failed history row, an unexpected checksum, or either table already existing without a V6 row | **Stop.** Do not run `repair` or `migrate`. Investigate first |
| `monthly_reflections` row count differs from 1 | Note it in the record. It does not block V6, but tell the owner (DEC-036) |

## 4. Apply V6

Pick one way, with the owner's approval:

- **A. Explicit, recommended for the first production rollout:** run `flyway migrate` once with the Flyway CLI against production, using the same migration folder. Then deploy the backend from `main`. Startup finds V6 already applied and only validates.
- **B. At backend startup:** deploy the backend from `main` and let Flyway apply V6 on start. This is simpler, but the migration runs without a human watching the output.

Either way:

1. Supply credentials only through environment variables or the secret manager. Never paste them into commands, shell history or docs.
2. Keep the `flyway info` / `migrate` output for the record (Section 8). Remove any connection strings from it first.
3. Do not run `flyway repair`. V6 needs no repair.

## 5. Verify after V6

1. Run the SQL in Section 6 (the "After" block). Expect:
   - successful versions 1–6, with V6 script `V6__reflections.sql`;
   - `reflections` has 7 columns and `reflection_answers` has 3;
   - all the constraints listed in Section 1;
   - `monthly_reflections` still has the same row count as in the preflight.
2. The backend starts without Flyway or Hibernate validation errors (check startup logs; no reflection text is ever logged).
3. Smoke test with a dedicated synthetic test account only, never a real user's account:
   - `GET /api/v1/insights` returns `200` for the current month.
   - `GET /api/v1/reflections/{current month}` returns `404 REFLECTION_NOT_FOUND` before saving.
   - `PUT` with one synthetic answer and the CSRF header returns `200` with `version: 1`.
   - `GET /api/v1/reflections` lists the month without answer text.
   - `DELETE` returns `204`; a second `GET` returns `404`.
   - `/insights` and `/reflection` render on the deployed frontend.
4. Delete the smoke-test reflection, as step 3 does, so nothing synthetic is left in production.

## 6. SQL checks (read-only)

```sql
-- Preflight and After: migration history
SELECT installed_rank, version, description, script, checksum, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;

-- Preflight: the new tables must not exist yet (expect 0 rows)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('reflections', 'reflection_answers');

-- Preflight and After: legacy table untouched (expected 1 row on 2026-11-16)
SELECT count(*) AS monthly_reflections_rows FROM public.monthly_reflections;

-- After: columns
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('reflections', 'reflection_answers')
ORDER BY table_name, ordinal_position;

-- After: constraints
SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('public.reflections'::regclass, 'public.reflection_answers'::regclass)
ORDER BY table_name, conname;
```

These queries read only metadata and a row count. They never select reflection text.

## 7. Recovery rules

- Never edit or delete Flyway history rows by hand, and never edit `V6__reflections.sql` once it is applied to production. A correction is a new migration (V7).
- If V6 fails: do not mark it successful by hand. Capture the error without credentials and keep the previous backend running. Investigate before trying again.
- Do not drop `reflections` or `reflection_answers` after users have saved reflections. A rollback uses a verified Neon restore point or a reviewed forward migration.
- Do not drop, convert or read the text of the legacy `monthly_reflections` table as part of this rollout. What to do with its one row is a separate owner decision (DEC-036).

## 8. Rollout record

Fill this in when the rollout is done. Leave out secrets and personal data.

| Item | Value |
|---|---|
| Date and time (UTC) | — |
| Run by / supervised by | — |
| Target (project, branch, endpoint, database) | — |
| Flyway CLI version | — |
| Preflight result (Section 3 state) | — |
| Way applied (A or B) | — |
| History after (versions, V6 checksum) | — |
| Table and constraint check | — |
| `monthly_reflections` rows before / after | — |
| Backend commit deployed | — |
| Smoke test result | — |
| Problems and follow-ups | — |
