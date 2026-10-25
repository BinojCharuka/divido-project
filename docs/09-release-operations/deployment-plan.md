# Deployment Plan

**Status:** Proposed — hosting provider and production topology not yet frozen  
**Goal:** Deploy Divido with controlled changes, verified data migrations, and a documented recovery path.

## 1. Deployment assumptions

The app is currently described as a Next.js frontend, Spring Boot backend, and PostgreSQL-compatible database. The final hosting providers, domain topology, TLS termination, and CI/CD platform remain to be confirmed. This plan intentionally avoids pretending those choices are already implemented.

## 2. Environments

Recommended promotion path:

`Local → CI/Test → Staging → Production`

- **Local:** rapid development with synthetic data.
- **CI/Test:** automated checks and disposable test database.
- **Staging:** production-like configuration and safe synthetic data; validates integrated behavior.
- **Production:** real users and data, restricted access and controlled deployment.

If a dedicated staging environment is not affordable initially, document the alternative and its risks. Never run test suites or destructive experiments against production.

## 3. CI/CD pipeline stages

Recommended stages, to implement in the chosen CI platform:

1. Checkout and verify source.
2. Install pinned dependencies.
3. Run frontend lint, typecheck, tests, and production build.
4. Run backend compile and unit tests.
5. Run integration, API, security, and migration tests appropriate to the change.
6. Validate OpenAPI and inspect dependency/security findings where tooling exists.
7. Build immutable frontend/backend artifacts.
8. Deploy to staging.
9. Run smoke tests and critical browser journeys.
10. Obtain the required release approval.
11. Deploy production artifact/configuration.
12. Run post-deploy health and critical journey checks.
13. Record version, migration version, result, and any incident/follow-up.

These are target stages, not a claim that the pipeline already exists. Begin with reliable checks and expand as the app matures.

## 4. Release versioning

Choose one versioning scheme and document it. A simple option is:
- Git commit SHA identifies the exact build.
- A release tag identifies a production release.
- Release notes list user-visible changes, migrations, configuration changes, and known limitations.

Never rely on a mutable artifact tag such as `latest` as the only way to identify what is running.

## 5. Database migration order

Database changes require special care because application rollback may not reverse data changes.

Recommended sequence:

1. Review the migration and its effect on existing records.
2. Test it on a disposable database matching the supported starting schema.
3. Back up or verify provider backup/restore availability before a risky production migration.
4. Prefer **expand-and-contract** changes for changes that span multiple releases:
   - add a compatible column/table/index first;
   - deploy code that can work with old and new structures as needed;
   - backfill safely if required;
   - switch reads/writes;
   - remove obsolete structures only in a later approved migration.
5. Apply the migration in the planned deployment order.
6. Deploy code that depends on the new schema.
7. Verify schema version and critical database operations.
8. Record the migration version and outcome.

Do not edit a Flyway migration already applied to a shared environment. Add a new forward migration to correct an issue.

## 6. Deployment strategy

For an MVP, a controlled in-place deployment may be adequate if downtime and risk are understood. Blue/green or canary deployment can be considered later if the hosting platform and scale justify it.

Before choosing, confirm:
- whether old and new application versions can coexist with the schema;
- how sessions behave during restart/deploy;
- how health checks affect traffic;
- how to stop a bad rollout;
- whether background jobs exist;
- how the platform handles environment variables and secrets.

Do not promise zero downtime unless the architecture and hosting plan support it.

## 7. Smoke tests after deploy

At minimum, verify:

- deployed build/commit matches the intended release;
- backend health endpoint responds as documented;
- database connectivity is healthy without exposing credentials;
- frontend loads and reaches the correct API origin;
- login/logout and protected routes work;
- a synthetic critical journey works if the environment supports safe test accounts;
- logs show no unexpected startup or database errors;
- no secret appears in browser bundles or client-visible responses.

Avoid creating real financial records during smoke testing. If production smoke tests require an account, use an explicitly approved synthetic test account and ensure it cannot contaminate real reporting.

## 8. Rollback and recovery

Rollback is a decision, not an automatic command.

1. Identify whether the failure is in application code, configuration, database migration, or external service.
2. Stop further rollout if the platform allows.
3. If the database schema remains backward compatible, consider redeploying the prior known-good application artifact.
4. Do not blindly reverse destructive migrations or restore an entire database without understanding data loss implications.
5. For data corruption, use the approved recovery procedure and preserve evidence.
6. Verify health, authentication, core transactions, and aggregates after recovery.
7. Document root cause and follow-up actions.

The owner must approve the authority and thresholds for production rollback.

## 9. Backup and restore

Confirm actual database-provider capabilities and plan limits before promising backup frequency or point-in-time recovery.

Document:
- what is backed up (database, uploaded files if any, configuration metadata);
- frequency and retention;
- encryption and access controls;
- recovery point objective (maximum tolerable data loss);
- recovery time objective (maximum tolerable outage);
- who can initiate a restore;
- how restored data is validated;
- how to avoid overwriting newer valid data.

Run a restore drill in a non-production environment before relying on backups.

## 10. Release records

For each release, keep:
- release tag and commit SHA;
- date/time and responsible person;
- frontend/backend artifact identifiers;
- database migration version;
- configuration changes (names only, never secret values);
- test and smoke-test evidence;
- known issues and accepted risks;
- rollback/recovery decision if invoked.

## 11. Decisions required before production

- hosting providers and topology;
- domain and HTTPS/TLS setup;
- CI/CD tool and approval policy;
- database backup/restore plan;
- session behavior during deployment;
- log retention and alert destination;
- release owner and emergency contacts;
- acceptable downtime, RPO, and RTO.
