# Backend Roadmap

**Status:** Proposed sequence — owner and developer review required  
**Stack assumption:** Spring Boot, Java 21, Maven, PostgreSQL, and Flyway. Verify actual project versions and dependencies before adding new libraries.

## 1. Principles

- Keep HTTP controllers thin; put business behavior in application/service layers.
- Validate inputs at the API boundary and enforce critical invariants in the domain/service and database where appropriate.
- Enforce user ownership on every user-scoped read and mutation.
- Return consistent error responses without leaking stack traces or internal SQL.
- Use decimal-safe money representations and an explicitly documented currency/precision policy.
- Keep schema changes in versioned Flyway migrations.
- Test behavior at unit, repository/integration, security, and API levels.

## 2. Suggested sequence

### BE-00 — Baseline and configuration

- Verify Java/Maven/Spring Boot versions and dependency tree.
- Confirm application startup, health endpoint, security configuration, and database connection.
- Confirm local configuration, environment-variable names, `.gitignore`, and secret handling.
- Record existing database tables and applied Flyway versions before changing the schema.
- Add a reproducible test command and basic CI checks.

**Exit criteria:** clean startup and test run are documented; no credentials are committed; existing migrations are understood.

### BE-01 — API conventions and error handling

- Implement one consistent validation/error envelope based on `docs/05-api/api-conventions.md`.
- Confirm JSON date/time and decimal serialization.
- Add request validation and a global exception handler.
- Ensure unexpected errors return safe messages and a correlation/request identifier if the app supports it.

**Exit criteria:** representative success, validation, not-found, unauthorized, forbidden, conflict, and server-error responses are tested.

### BE-02 — Authentication, session, and user ownership

- Confirm login identifier and account recovery policy before finalizing auth contracts.
- Choose and verify a maintained session strategy compatible with the selected Spring Boot version.
- Configure secure cookie flags by environment and implement CSRF protection for state-changing requests.
- Define session expiry, logout invalidation, brute-force/rate-limit approach, and password storage policy.
- Add tests proving one user cannot read or modify another user's records.

**Exit criteria:** authentication and authorization tests pass; session lifecycle and CSRF behavior are verified in the actual browser/API setup.

### BE-03 — Profile and onboarding

- Implement profile retrieval/update and onboarding completion only after required fields are approved.
- Enforce user-scoped data access and validation.
- Decide whether onboarding is a distinct state or inferred from profile completeness.

**Exit criteria:** new and returning users receive consistent profile state; validation and ownership are tested.

### BE-04 — Categories and income sources

- Model built-in categories separately from user-owned custom categories if that is the approved design.
- Define uniqueness scope, normalized-name behavior, deletion constraints, and soft-delete policy.
- Provide stable identifiers and sorting.
- Implement income sources only after the product contract is approved.

**Exit criteria:** seeded categories are repeatable and custom-category ownership/duplicate cases are covered.

### BE-05 — Transactions

- Implement income and expense types according to the approved transaction model.
- Validate positive amounts, supported precision, currency, transaction date, category ownership, and income-source references.
- Apply ownership checks and soft-delete/restore behavior consistently.
- Add indexes for actual query patterns, not speculatively.
- Use transactions for multi-step database changes.

**Exit criteria:** create/list/filter/update/delete-or-restore flows and boundary cases are tested against PostgreSQL.

### BE-06 — Monthly budgets and dashboard

- Define month boundaries and timezone policy before implementing queries.
- Distinguish planned income, actual income, budget allocations, savings target, and actual spending.
- Centralize calculations and add tests for zero income, overspending, month boundaries, deleted records, and missing categories.
- Ensure all dashboard queries are user-scoped and efficient enough for expected MVP usage.

**Exit criteria:** deterministic fixtures produce expected totals across normal and edge cases.

### BE-07 — Insights and reflections

- Implement insights only after the habit algorithm, minimum-data threshold, and wording/uncertainty policy are approved.
- Keep rules explainable and testable; avoid machine-learning dependencies for a simple rule-based MVP unless explicitly approved.
- Define whether reflections can be edited/deleted and for how long they are retained.
- Avoid exposing one user's aggregates in another user's responses.

**Exit criteria:** tests cover insufficient data, boundary conditions, date ranges, and user isolation.

### BE-08 — Hardening

- Add security tests for authentication, authorization, CSRF, validation, and data exposure.
- Verify database constraints and migration behavior.
- Review N+1 queries, pagination limits, indexes, and log content.
- Confirm health/readiness behavior and safe production error handling.

**Exit criteria:** required CI checks pass and release blockers are resolved.

## 3. Suggested backend structure

Use this only if it fits the existing codebase; avoid a broad reorganization solely to match this diagram.

```text
backend/src/main/java/.../
  config/
  common/
    error/
    security/
  auth/
    controller/
    service/
    dto/
  profile/
  category/
  income/
  transaction/
  budget/
  dashboard/
  insight/
  reflection/
```

For each feature, keep controller, service/application logic, persistence, and DTO responsibilities clear. Avoid exposing JPA entities directly as API responses.

## 4. Database and migration rules

- Inspect `flyway_schema_history` and current database state before making changes.
- Do not modify an already-applied migration. If `V1__init.sql` has been applied in a shared environment, preserve it and add the next ordered migration.
- Use constraints for invariants that must hold even if application code has a bug.
- Prefer explicit foreign keys and indexes that support known access patterns.
- Make seed operations idempotent where the tool and migration strategy permit.
- Test a migration from both an empty database and the current schema when feasible.
- Avoid real user financial data in seed files and tests.

See [migration policy](../06-data/migration-policy.md).

## 5. API implementation checklist

For every endpoint:

- Is authentication required?
- Is the current user derived from the authenticated session rather than a client-supplied owner ID?
- Are resource ownership and soft-delete state checked?
- Are input bounds and formats validated?
- Are status codes and response shapes documented in OpenAPI?
- Are error responses consistent?
- Are pagination and sorting bounded if applicable?
- Are tests written for success, invalid input, unauthenticated, forbidden, not-found, and duplicate/conflict paths as appropriate?
- Are logs free of secrets and sensitive payloads?

## 6. Test layers

- **Unit:** domain/service rules and calculations.
- **Repository/integration:** persistence, constraints, and query behavior against PostgreSQL.
- **API integration:** serialization, validation, status codes, and error envelope.
- **Security:** session, CSRF, ownership isolation, and unauthorized access.
- **Migration:** schema upgrade and seed behavior.

Prefer tests that exercise real PostgreSQL behavior for SQL constraints and migration-dependent features; an in-memory database may not be a faithful substitute.

## 7. Open decisions that block final implementation

Track and obtain approval for: login identifier, account recovery, session expiry, profile/onboarding fields, category definitions, money precision, timezone/month rules, soft-delete semantics, spending-habit algorithm, and reflection retention. Refer to [decision log](../00-governance/decision-log.md) and the relevant product/API docs.
