# Neon V7 Account Lifecycle Rollout — Production Runbook

**Status:** PROPOSED — not yet run. Owner supervision required.
**Applies to:** `backend/src/main/resources/db/migration/V7__account_lifecycle.sql` for DIV-022, DIV-023, DIV-029 and DIV-035 (`DEC-043` to `DEC-046`). It is on branch `feature/div-022-023-029-035-account` and not merged yet.
**Previous runbook:** [`neon-v6-reflections-rollout.md`](neon-v6-reflections-rollout.md). V6 must be applied and verified first.

## 1. What V7 does

All changes are additive.

- **`app_users.onboarding_completed_at TIMESTAMPTZ`:** set to `created_at` for every existing row. Existing users count as onboarded (`DEC-044`) and never see the onboarding screens.
- **`app_users.credentials_version INTEGER NOT NULL DEFAULT 0`:** includes a `CHECK >= 0`.
- **New table `password_reset_tokens`:** a foreign key to `app_users(id) ON DELETE CASCADE`, a unique `token_hash` with a hex-format check, and an index on `user_id`.

V7 does not read, change or drop the legacy production columns `app_users.onboarding_complete` and `app_users.locale`, or the legacy tables `budgets` and `monthly_reflections`. It uses different column names on purpose. Plain `CREATE TABLE` fails if a `password_reset_tokens` table already exists.

`LegacyProductionHistoryMigrationTest` runs V5 → V6 → V7 on a synthetic copy of the production history, so the migration is tested.

## 2. The backend applies migrations at startup

As with V6, the first backend deploy that contains V7 runs it on startup (`spring.flyway.enabled: true`).

| Situation | What happens |
|---|---|
| The new backend starts and V7 fails | Startup stops, and Flyway rolls the migration back. |
| An old backend runs against a database that has V7 | It keeps working. It does not map the new columns, and Hibernate only validates what it maps. |
| The new backend runs against a database without V7 | It cannot start. `AppUser` maps `credentials_version`, so V7 must run first, at startup or with the CLI. |

All signed-in sessions end at the deploy, as with any backend restart: sessions are in memory. Users sign in again.

## 3. Configuration before deploying

Set these on the production backend before or with the deploy. See [configuration-and-secrets.md](configuration-and-secrets.md).

- **`DIVIDO_APP_PUBLIC_URL`:** the production frontend origin, `https://…` with no trailing path. The backend refuses to start if the value is not a valid `http(s)` URL.
- **`DIVIDO_MAIL_ENABLED=false`:** keep this until an SMTP provider is chosen. While it is `false`, "Forgot password" shows its normal neutral message but sends no email. This is an open item.
- **When SMTP is ready:**
  - `DIVIDO_MAIL_ENABLED=true`;
  - `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (a secret);
  - `DIVIDO_MAIL_FROM`.

## 4. Read-only preflight

Confirm a Neon restore point first. Use the direct endpoint of branch `production`, database `neondb`.

```sql
-- Expect versions 1–6 successful and no V7 row.
SELECT version, description, script, success
FROM flyway_schema_history ORDER BY installed_rank;

-- Expect no rows: the new columns and table must not exist yet.
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'app_users' AND column_name IN ('onboarding_completed_at', 'credentials_version'))
       OR table_name = 'password_reset_tokens');

-- For the record.
SELECT count(*) AS users FROM app_users;
```

| State found | Action |
|---|---|
| Versions 1–6 successful, no V7, the second query returns nothing | Go on to Section 5. |
| V6 missing | Do the V6 runbook first. |
| V7 already successful | Skip to Section 6 and record who applied it and when. |
| A failed row, or the columns or table already exist without a V7 row | **Stop.** Do not run `repair` or `migrate`. Investigate first. |

## 5. Apply V7

Same choice as for V6:

- **A, explicit (recommended):** run `flyway migrate` with the CLI, then deploy.
- **B, at startup:** deploy and let the backend apply it.

Pass credentials only through environment variables or the secret manager. Do not run `flyway repair`.

## 6. Verify

```sql
SELECT version, script, success FROM flyway_schema_history WHERE version = '7';

-- Expect 0: every existing user is marked onboarded.
SELECT count(*) FROM app_users WHERE onboarding_completed_at IS NULL;

-- Expect 6 columns.
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'password_reset_tokens' ORDER BY ordinal_position;
```

Then smoke-test with a dedicated synthetic test account, never a real user:

1. Sign up: you land on `/onboarding`. Skip it.
2. In Settings, change the display name.
3. Change the password.
4. Sign out, then sign in with the new password.
5. If mail is enabled: request a reset link and use it once. A second use must fail.
6. Delete the test account. Afterwards no row for its email may remain in `app_users`.

## 7. Record

Write down, without any connection strings or secrets:

- the date;
- who ran it;
- method A or B;
- the preflight and verify results;
- the smoke-test outcome.

Record them in [the progress tracker](../00-governance/progress-tracker.md) under DIV-022/023/029/035.
