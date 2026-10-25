# Test Strategy

**Status:** Proposed — owner and developer review required  
**Goal:** Detect defects early and provide repeatable evidence that the app is safe to integrate and release.

## 1. Quality goals

Testing should provide confidence that:

- approved requirements and acceptance criteria are met;
- income, expense, budget, and dashboard calculations are correct;
- one user cannot read or change another user's data;
- sessions, cookies, CSRF, and input validation work as intended;
- API contracts and OpenAPI documentation agree with implementation;
- database migrations work from supported starting states;
- the UI behaves under loading, empty, validation, network, and session-expiry conditions;
- release-critical user journeys work in the integrated environment.

## 2. Test pyramid

| Layer | What it verifies | Typical location | Run frequency |
|---|---|---|---|
| Static checks | Formatting, lint, types, compile, dependency/config errors | frontend/backend CI | Every PR |
| Unit tests | Pure logic, validators, calculations, component behavior | colocated test files or test source sets | Every PR |
| Repository/integration tests | SQL, constraints, persistence, migrations, service wiring | backend integration tests | Every PR for changed areas; full suite in CI |
| API/contract tests | HTTP status, schemas, error envelope, auth, serialization | backend API tests / OpenAPI validation | Every API PR |
| Component tests | Forms, user interactions, loading/error/empty states | frontend tests | Every frontend PR |
| End-to-end tests | Real browser-to-API user journeys | e2e suite | Critical paths on PR or pre-release |
| Manual exploratory tests | Usability, responsive behavior, edge cases | test checklist / issue | Each major feature and release |

Do not add every layer to every tiny change. Choose the lightest test that gives meaningful evidence, and add higher-level coverage for high-risk behavior.

## 3. Suggested tooling (verify before adopting)

Tool choices are proposals and must be checked against the actual dependencies and repository setup:

- Frontend: the project's existing test runner; if none exists, evaluate Vitest with React Testing Library for unit/component tests and Playwright for browser-level journeys.
- Backend: JUnit 5 and Spring Boot Test; Mockito where isolation is useful; Testcontainers for PostgreSQL-backed tests if practical.
- API: MockMvc or the existing HTTP integration approach; validate OpenAPI with an appropriate linter/validator in CI.
- Database: run Flyway migrations against PostgreSQL in disposable test environments; use synthetic fixtures.
- Security: Spring Security test support plus explicit cross-user and CSRF tests.
- Static checks: existing ESLint/TypeScript and Maven checks; add CI steps only after commands are confirmed.

Do not add a dependency just because it is listed here. Check Java/Spring Boot and Node/package-manager versions first. Prefer the tool already installed when it provides adequate coverage.

## 4. Risk-based priority

**P0 — release blocking**
- Cross-user data leakage or unauthorized mutation.
- Authentication/session bypass or CSRF weakness in a state-changing endpoint.
- Incorrect money calculations that materially misrepresent a user's finances.
- Migration that can destroy or corrupt existing data.
- Production secrets exposed.

**P1 — high**
- Core transaction creation/editing/listing fails.
- Dashboard totals or budget warnings are wrong.
- Session expiry or logout behaves incorrectly.
- A critical API contract is incompatible with the frontend.
- Data is unintentionally deleted or not restored according to the approved policy.

**P2 — medium**
- Non-critical validation or error messaging is confusing.
- Responsive layout defect blocks a common viewport.
- Insight or reflection behavior is incorrect but does not expose data or corrupt records.

**P3 — low**
- Minor visual inconsistency with no functional or accessibility impact.

The owner should approve severity classifications and release-blocking thresholds.

## 5. Test data strategy

- Create deterministic synthetic users such as `alice-test` and `bob-test`, with distinct categories and transactions.
- Use a fixed clock or explicit dates for month-boundary and habit-window tests.
- Keep fixtures small, named, and reproducible.
- Avoid relying on current wall-clock time unless testing time-dependent behavior itself.
- Do not use production exports, real email addresses, real phone numbers, or actual financial records.
- Do not print passwords, cookies, session IDs, or sensitive request bodies in logs.
- Isolate each test so test order does not affect outcomes.
- Clean up records or use a disposable database/schema per test suite.

## 6. Backend test layers

### Unit tests
Test pure business rules without starting the entire application where practical:
- amount and precision validation;
- group/category mapping;
- budget allocation calculations;
- month/date calculations;
- insight eligibility and confidence rules;
- error mapping and business-rule edge cases.

### Service tests
Test orchestration, ownership checks, state transitions, and transaction boundaries. Mock external collaborators only where it makes the test clearer.

### Repository and database tests
Use PostgreSQL for behaviors that depend on PostgreSQL-specific SQL, constraints, indexes, or Flyway. An in-memory database may not accurately reproduce these behaviors.

### API integration tests
Verify actual JSON serialization, status codes, validation, security filters, error format, and database effects.

## 7. Frontend test layers

- Unit-test pure formatting and validation helpers.
- Component-test transaction forms, category selection, budget forms, and error rendering.
- Test accessible names, keyboard use, disabled/pending states, and focus behavior.
- Test API client credentials/CSRF handling and error normalization.
- Use browser tests for high-value journeys and session behavior.
- Use synthetic fixtures; avoid brittle tests tied to incidental markup or exact styling.

## 8. Contract and schema checks

- Validate that documented request/response fields match implementation.
- Check status codes and error response shapes.
- Run OpenAPI validation when a validator is configured.
- Ensure migrations are ordered and apply from the intended starting schema.
- Where feasible, test both an empty database and the current supported schema.
- Never modify an already-applied Flyway migration to make a test pass; add a corrective migration.

## 9. Security test principles

Every user-scoped API should have tests for:
- no session / invalid session;
- authorized access to own record;
- attempt to access another user's record;
- attempt to mutate another user's record;
- invalid or missing CSRF token for cookie-authenticated state changes, where applicable;
- expired or logged-out session;
- malformed input and overlarge payloads;
- safe error responses and absence of sensitive values in logs.

For a resource ID supplied by a client, test both read and write operations. Random/unpredictable IDs do not replace ownership checks.

## 10. Coverage policy

Do not set a numeric code-coverage threshold until the repository has a baseline and the team understands what it measures. Prefer strong tests for critical business logic and security boundaries over a high percentage dominated by trivial getters or snapshots. A threshold can be introduced later as an approved CI policy.

## 11. Pull request gate

For every PR, record:
- exact checks run and their result;
- tests added/changed;
- any test skipped and why;
- known risk or follow-up issue;
- whether database/API/security behavior changed.

Minimum recommended checks:
- frontend lint/typecheck/tests/build for relevant frontend changes;
- backend compile/unit tests for relevant backend changes;
- integration/contract tests for API or persistence changes;
- migration verification for schema changes;
- cross-user/CSRF tests for relevant security changes.

## 12. Release gate

Before release:
- run the full required test suite;
- run the [regression checklist](regression-checklist.md);
- verify critical journeys against a release-like environment;
- verify migrations and deployment order;
- confirm no P0/P1 defects remain unless the owner explicitly accepts a documented exception;
- record the release evidence and any known limitations.

## 13. Test failure policy

A failure is a signal, not an obstacle to hide. Reproduce it, determine whether the code, test, environment, or requirement is wrong, and record the decision. Change a test only when expected behavior has legitimately changed or the test is demonstrably incorrect; review that change as part of the PR.
