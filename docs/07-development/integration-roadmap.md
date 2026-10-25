# Integration Roadmap

**Status:** Proposed — owner and developer review required  
**Purpose:** Coordinate the frontend and backend developers so each feature works end-to-end before the next dependent feature starts.

## 1. Integration rule

A feature is not integrated merely because the frontend compiles and the backend endpoint returns a response independently. It is integrated when the agreed user journey works against the real API and database, with authorization, validation, and error behavior verified.

## 2. Suggested integration gates

| Gate | Slice | Frontend deliverable | Backend deliverable | Integration evidence |
|---|---|---|---|---|
| INT-00 | Baseline | App runs locally | API and DB run locally | Both developers can run the documented setup |
| INT-01 | API/error conventions | Shared API client and error states | Standard response/error behavior | Contract tests and one real request |
| INT-02 | Authentication | Login/logout/session-aware UI | Session, CSRF, auth endpoints | Browser login, logout, expiry, CSRF checks |
| INT-03 | Profile/onboarding | Profile and onboarding screens | Profile endpoints and persistence | New-user and returning-user paths |
| INT-04 | Categories | Category picker and management UI | Built-in/custom category APIs | Categories load; validation and ownership work |
| INT-05 | Transactions | Income/expense forms and list | Transaction endpoints and persistence | Create/list/edit/soft-delete path with real DB |
| INT-06 | Budgets | Monthly planning UI | Budget persistence and rules | Saved allocations and warnings reconcile |
| INT-07 | Dashboard | Summary and month navigation | Aggregation endpoints | Values match deterministic test fixtures |
| INT-08 | Insights/reflection | Insight and reflection UI | Explainable rules and persistence | Insufficient-data and privacy cases pass |
| INT-09 | Release | Production-ready routes | Production configuration and health | Release checklist and critical journey pass |

This order is a proposal. Reorder if dependencies or approved product decisions require it.

## 3. Contract handshake

Before parallel implementation, attach to the issue:

- Link to endpoint documentation and OpenAPI operation.
- Example success request and response.
- Example validation error response.
- Authentication/CSRF expectations.
- Ownership and deletion semantics.
- Date/time and currency assumptions.
- Test cases for at least one success and one failure path.

If the API contract changes, both developers acknowledge the change before merging dependent work.

## 4. Shared local environment

Document one repeatable setup that both developers can follow:

- Required Java, Maven, Node.js, and package-manager versions.
- PostgreSQL/Neon configuration and safe local credentials.
- Required environment-variable names (never actual secret values).
- Commands to start backend and frontend.
- CORS, cookie, and CSRF settings for local development.
- Health-check URL and expected response.
- Migration and seed commands.
- Test commands and known environment limitations.

Do not assume a `.env` file is automatically loaded by Spring Boot. Follow the actual configuration method documented in the repository, and never commit secret-bearing `.env` files.

## 5. Cross-stack date and money rules

Before implementation, agree and document:

- Currency and decimal precision; avoid floating-point money arithmetic.
- Whether transaction dates represent local calendar dates or timestamps.
- User timezone and month boundary rules.
- How dates are serialized in API responses.
- How deleted transactions affect aggregates and insights.
- How planned values differ from actual transaction totals.

The initial product proposal uses LKR and Asia/Colombo, but treat those defaults as proposed until explicitly approved. Do not hard-code currency or timezone into calculations without a documented policy.

## 6. Integration test checklist

For each vertical slice, verify:

- Happy path from UI to database and back.
- Empty data state.
- Client validation and server validation.
- Network failure and server error.
- Unauthenticated request.
- Cross-user access attempt.
- Duplicate submit and conflict behavior.
- Date/month boundary.
- Soft-deleted data behavior.
- Refresh/navigation after save.
- Browser cookies and CSRF behavior where relevant.
- UI displays only the intended fields and no internal errors.

Not every item applies to every endpoint; document the relevant subset in the issue.

## 7. Mocking policy

Mocks can unblock UI work before a backend endpoint exists, but:

- Store mock fixtures in a clearly named development/test location.
- Keep fixtures aligned with OpenAPI.
- Never silently fall back to fake data after a real API error.
- Do not merge a feature as complete while production paths still depend on mocks.
- Replace mock-only tests with at least one integration check before declaring the slice done.

## 8. Shared acceptance session

For major slices, both developers should run a short acceptance session using a clean test account and known data. Capture any mismatch as a GitHub issue, not just a verbal note. Avoid real personal financial information in test accounts or screenshots.

## 9. Integration exit criteria

A slice can move to **Integrated** when:

1. Frontend and backend changes are merged.
2. The real user journey works in the shared environment.
3. API contract and schema docs match implementation.
4. Required tests pass.
5. Authorization and validation cases have been checked.
6. Known limitations are recorded.
7. The parent issue and traceability status are updated.
