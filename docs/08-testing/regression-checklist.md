# Regression Checklist

**Status:** Proposed checklist — adapt to the current implemented scope  
**Purpose:** Repeatable verification before merging a major feature and before a release.

Mark each item **Pass**, **Fail**, **Blocked**, or **N/A**. For any Fail/Blocked item, record an issue and owner. Do not mark an item Pass without running it.

## 1. Build and environment

- [ ] Fresh checkout setup instructions work.
- [ ] Frontend dependencies install using the committed lockfile.
- [ ] Frontend lint/typecheck/tests pass where configured.
- [ ] Frontend production build passes.
- [ ] Backend compiles and unit tests pass.
- [ ] Backend integration/API tests pass for changed areas.
- [ ] Required environment variables are documented and validated.
- [ ] No secret-bearing `.env` or local configuration is tracked.
- [ ] Health endpoint matches the implemented/documented contract.

## 2. Authentication and security

- [ ] Login success and invalid login behavior verified.
- [ ] Logout invalidates the session.
- [ ] Protected route/API denies unauthenticated requests.
- [ ] Expired session behavior verified.
- [ ] CSRF behavior verified for cookie-authenticated state changes.
- [ ] Cookie flags and CORS configuration checked in a browser-like environment.
- [ ] User A cannot read, update, or delete User B's records.
- [ ] Dashboard/insights do not aggregate another user's data.
- [ ] Errors and logs do not expose secrets or sensitive details.

## 3. Profile and categories

- [ ] Onboarding validation and persistence verified, if implemented.
- [ ] Built-in categories and Kakeibo group mappings are correct.
- [ ] Custom categories work according to approved ownership/uniqueness rules, if implemented.
- [ ] Invalid or foreign category references are rejected.
- [ ] Income-source behavior works according to the approved scope, if implemented.

## 4. Transactions

- [ ] Valid expense can be created and reloaded.
- [ ] Valid income can be created and reloaded.
- [ ] Zero, negative, malformed, and excessive-precision amounts are rejected.
- [ ] Required/optional fields match the approved contract.
- [ ] Editing changes only permitted fields.
- [ ] Date filtering and month boundaries are correct.
- [ ] Duplicate-submit behavior is acceptable.
- [ ] Soft-delete/restore behavior matches policy, if implemented.
- [ ] Lists and dashboard totals reflect transaction changes correctly.

## 5. Budgets and dashboard

- [ ] Planned income is distinguishable from actual income.
- [ ] Budget allocations and savings target follow approved rules.
- [ ] Over-allocation warning behaves as specified, if approved.
- [ ] Dashboard values reconcile against deterministic fixture calculations.
- [ ] Empty month and zero-value states do not crash or mislead.
- [ ] Month navigation and timezone boundaries are correct.

## 6. Insights and reflection

- [ ] Insufficient history does not produce unsupported habit claims.
- [ ] Insight algorithm is deterministic for fixed test data.
- [ ] User-specific insights use only that user's permitted data.
- [ ] Reflection save/edit/delete/retention behavior matches policy, if implemented.
- [ ] API failures do not show false save success.

## 7. UI and accessibility

- [ ] Critical screens work at agreed mobile and desktop widths.
- [ ] Keyboard navigation and focus visibility checked.
- [ ] Form labels and error messages are accessible.
- [ ] Loading, empty, success, and error states are understandable.
- [ ] Session expiry does not falsely report successful changes.
- [ ] No production path silently falls back to mock data.

## 8. Database and contract

- [ ] Flyway migrations apply from the supported starting schema.
- [ ] Applied migrations have not been edited.
- [ ] Constraints and foreign keys enforce expected integrity.
- [ ] OpenAPI matches actual API behavior.
- [ ] Error schema and status codes remain consistent.
- [ ] Seed/test fixtures are synthetic and repeatable.
- [ ] Data dictionary and ERD reflect schema changes.

## 9. Release readiness

- [ ] Critical end-to-end journeys pass in a release-like environment.
- [ ] Deployment configuration and secrets are reviewed.
- [ ] Migration/deployment order is documented.
- [ ] Health/readiness and logs are checked after deployment.
- [ ] Recovery/rollback limitations are understood.
- [ ] No unresolved P0/P1 defect remains, or an explicit owner-approved exception is documented.
- [ ] Known limitations and follow-up issues are recorded.
- [ ] Documentation index, phase status, and traceability matrix are updated.

## 10. Execution record

Record below for each run:

| Field | Value |
|---|---|
| Date/time and timezone | |
| Tester | |
| Commit/build identifier | |
| Environment | |
| Checklist type | PR / integration / release |
| Result | Pass / Fail / Blocked |
| Failed item IDs and issue links | |
| Evidence location (synthetic data only) | |
