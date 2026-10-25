# Definition of Done

**Status:** Proposed quality gate — owner approval required  
**Purpose:** Prevent “works on my machine” from being treated as complete delivery.

## 1. Universal completion checklist

A task is Done only when all applicable checks are satisfied:

- [ ] The agreed scope is implemented; no unapproved scope has been added.
- [ ] Acceptance criteria are testable and satisfied.
- [ ] Code follows the repository's established conventions.
- [ ] Tests are added or updated for meaningful behavior and boundary cases.
- [ ] Relevant lint, typecheck, compile, test, and build checks pass.
- [ ] No secrets, credentials, session IDs, or real personal financial data are committed.
- [ ] Errors are handled without exposing internal implementation details.
- [ ] Accessibility and responsive behavior are considered for user-facing changes.
- [ ] API, product, architecture, and data documentation are updated where behavior changed.
- [ ] OpenAPI matches the implemented contract.
- [ ] Database migrations are versioned and have not modified applied migration history.
- [ ] Security and user-ownership checks are covered where relevant.
- [ ] PR review comments are resolved or explicitly agreed as follow-up work.
- [ ] The change is merged through the agreed workflow.
- [ ] The issue, phase status, and traceability references are updated.
- [ ] Integration evidence exists for cross-stack behavior.

## 2. Frontend-specific checks

- [ ] Loading, empty, success, validation, and error states are implemented as relevant.
- [ ] Form labels, focus visibility, keyboard navigation, and accessible feedback are checked.
- [ ] The UI handles expired sessions and unauthorized responses appropriately.
- [ ] API errors are not silently replaced with fake data.
- [ ] Pending actions prevent accidental duplicate submissions where necessary.
- [ ] Dates, currency, decimal values, and month boundaries follow the agreed contract.
- [ ] Production build succeeds.

## 3. Backend-specific checks

- [ ] Authentication requirements are correct for the endpoint.
- [ ] The current user is derived from trusted server-side authentication context.
- [ ] Every user-scoped query and mutation enforces ownership.
- [ ] Inputs are validated and database invariants are enforced where appropriate.
- [ ] Success and failure status codes match API documentation.
- [ ] Logs do not contain secrets or unnecessary financial/personal data.
- [ ] Tests cover relevant invalid input, not-found, conflict, unauthorized, and forbidden cases.
- [ ] Transactions and concurrency behavior are appropriate for the operation.
- [ ] Database query behavior is acceptable for the expected use case.

## 4. Database-specific checks

- [ ] Schema and data-dictionary docs are updated.
- [ ] New changes use a new ordered Flyway migration.
- [ ] Migration is tested against the intended starting schema.
- [ ] Constraints, indexes, defaults, and nullability match business rules.
- [ ] Seed data is deterministic and contains no real user information.
- [ ] Soft-delete and retention effects are understood.
- [ ] Recovery/deployment implications are documented for risky changes.

## 5. API contract-specific checks

- [ ] Request and response schemas are documented.
- [ ] Required fields, formats, bounds, and validation errors are clear.
- [ ] Authentication, CSRF, ownership, and permissions are documented.
- [ ] Pagination, sorting, filtering, and date semantics are defined where relevant.
- [ ] Error envelope and status codes are consistent.
- [ ] OpenAPI validation or equivalent checks pass when configured.

## 6. Security-sensitive change gate

For authentication, session, authorization, user data, secrets, or deployment configuration, require explicit review from the other developer and owner where available. Confirm:

- [ ] Threat and misuse cases considered.
- [ ] Cross-user isolation tests added or updated.
- [ ] Cookies, CSRF, CORS, and transport settings remain consistent.
- [ ] No credentials or sensitive information appear in client bundles or logs.
- [ ] Migration and recovery behavior is understood.
- [ ] No release-blocking security concern remains.

## 7. Integrated feature gate

A user-visible feature that spans frontend and backend is not Done until:

1. The real UI calls the real endpoint.
2. Data persists and reloads correctly.
3. Expected validation and error messages appear.
4. A user cannot access another user's records by changing IDs or requests.
5. The agreed deletion, restoration, date, and currency behavior is verified.
6. The feature works in the shared development environment.
7. The parent issue and traceability matrix are updated.

## 8. What “Done” does not mean

- A screen exists but uses mock data.
- An endpoint returns a success response but ignores persistence or ownership.
- Code compiles but tests were not run.
- A migration works only because a developer manually altered the database.
- A product assumption was implemented without approval.
- Documentation says a feature exists when it has not been integrated.
- A PR is merged but known acceptance criteria remain unmet.

## 9. Waivers

If an item cannot be completed, do not silently tick it. Record the reason, risk, owner, and follow-up issue. The project owner decides whether the exception is acceptable, especially for security, data integrity, and release readiness.
