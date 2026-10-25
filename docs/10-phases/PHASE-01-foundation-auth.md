# Phase 01 — Foundation and Authentication

**Status:** Proposed sequence — dependent on Phase 00 approval  
**Primary outcome:** A reliable application foundation with secure, tested user identity and profile/onboarding behavior.

## Goal

Make the app reproducibly runnable and establish the security boundary that all later personal-finance features rely on.

## Entry criteria

- Phase 00 exit criteria satisfied for authentication, environment, and initial data model.
- Login identifier and account recovery expectations approved.
- Session, cookie, CSRF, CORS, and expiry policies agreed.
- First API contract reviewed and marked approved.

## Workstreams

### BE-01 — Backend foundation
- [ ] Verify Java, Spring Boot, Maven, PostgreSQL, and Flyway versions.
- [ ] Confirm health endpoint behavior and document its actual response.
- [ ] Verify database connection and environment configuration.
- [ ] Implement consistent error handling and request validation.
- [ ] Confirm Flyway migration baseline and applied versions.
- [ ] Add backend unit and integration test conventions.
- [ ] Ensure no secret values are committed.

### BE-02 — Authentication and authorization
- [ ] Implement approved registration/login behavior.
- [ ] Store passwords using an appropriate maintained password-hashing mechanism; never store plaintext passwords.
- [ ] Implement the approved server-side session strategy.
- [ ] Configure secure cookie attributes for each environment.
- [ ] Implement CSRF protection for applicable state-changing requests.
- [ ] Implement logout/session invalidation and expiry behavior.
- [ ] Ensure protected endpoints derive the current user from server-side authentication, not client-provided owner IDs.
- [ ] Add tests for invalid login, unauthenticated requests, expired sessions, logout, CSRF, and cross-user access.

### BE-03 — Profile and onboarding
- [ ] Implement only the approved profile/onboarding fields.
- [ ] Define required vs optional validation.
- [ ] Define onboarding completion state and return behavior.
- [ ] Ensure profile reads/updates are user-scoped.
- [ ] Add tests for new, incomplete, and returning user states.

### FE-01 — Frontend foundation
- [ ] Verify Node/package-manager/framework versions and lockfile.
- [ ] Establish agreed route/layout/component conventions.
- [ ] Add shared loading, empty, error, and form-validation patterns.
- [ ] Add API client with agreed credentials and CSRF behavior.
- [ ] Implement session-aware route/navigation behavior.
- [ ] Add accessible login and approved onboarding/profile screens.
- [ ] Ensure private secrets are not included in browser bundles.

### INT-01 — Integrated verification
- [ ] Run a clean local setup using documented instructions.
- [ ] Verify login → protected route → logout in a real browser.
- [ ] Verify expired/invalid session behavior.
- [ ] Verify CSRF behavior for a state-changing operation.
- [ ] Verify one user cannot access another user's profile/resources.
- [ ] Confirm OpenAPI and implementation agree.

## Deliverables

- Reproducible frontend/backend startup.
- Approved authentication/session flow.
- Profile/onboarding endpoints and UI, if approved.
- Security tests and initial CI checks.
- Updated architecture, API, and security documentation.

## Exit criteria

- [ ] App builds and starts using documented setup.
- [ ] Authentication and session lifecycle tests pass.
- [ ] Cross-user isolation tests pass.
- [ ] CSRF/cookie behavior verified in the browser.
- [ ] Profile/onboarding journey works end-to-end if in scope.
- [ ] No unresolved release-blocking security issue remains.
- [ ] API and documentation reflect actual implementation.

## Dependencies and cautions

- Do not finalize session library/version until compatibility with the actual Spring Boot version is verified.
- Do not add endpoints or onboarding fields just because a draft document mentions them.
- Preserve already-applied database migrations; create new migrations for schema changes.
