# Set 8 — Testing & Quality Assurance

**Status:** Proposed test strategy — project-owner approval required  
**Applies to:** Divido frontend, backend, API contract, database migrations, security, and release validation

## Purpose

This set defines how the team proves that Divido behaves correctly, protects each user's financial data, and remains stable as features are added. It is a test plan, not evidence that tests or CI are already implemented.

## Documents

- [Test strategy](test-strategy.md) — test layers, responsibilities, and release gates.
- [Test cases](test-cases.md) — cross-feature and end-to-end scenarios.
- [API test cases](api-test-cases.md) — HTTP contract, validation, and authorization checks.
- [Frontend test cases](frontend-test-cases.md) — UI states, forms, accessibility, and browser journeys.
- [Security test cases](security-test-cases.md) — authentication, session, CSRF, user isolation, and sensitive data.
- [Regression checklist](regression-checklist.md) — repeatable checks before merging and releasing.

## Related documentation

- [Requirements and user stories](../03-requirements/README.md)
- [Architecture and security](../04-architecture/README.md)
- [API contract and OpenAPI](../05-api/README.md)
- [Data model and migration policy](../06-data/README.md)
- [Development workflow and Definition of Done](../07-development/README.md)
- [Release operations](../09-release-operations/README.md)
- [Phase roadmap](../10-phases/README.md)

## Non-negotiable principles

1. Tests should verify observable behavior and business rules, not merely implementation details.
2. Every test must use synthetic test data; never use real personal financial records or production secrets.
3. Server-side authorization is mandatory. Hiding a UI control is not access control.
4. API, data, and date/money rules must come from the approved contract, not assumptions in tests.
5. A failing test must be investigated; do not delete or weaken it just to get a green build.
6. A test plan or checklist is not proof of execution. Record the actual command and result.
7. Do not label a requirement frozen until the owner approves it.

## How to use this set

For each user story, select applicable cases, add missing edge cases, and link the tests to the issue/acceptance criteria. Keep tests proportionate to risk: authentication, ownership isolation, money calculations, and schema migrations need stronger coverage than purely decorative UI changes.
