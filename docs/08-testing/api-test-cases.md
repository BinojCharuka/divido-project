# API Test Cases

**Status:** Proposed — adapt to approved `docs/05-api/openapi.yaml` and actual implementation  
**Important:** Endpoint names and schemas are provisional until the API contract is approved. Do not infer missing endpoints from this checklist.

## 1. Common API checks

For each implemented operation, verify:

- Correct HTTP method and route.
- Correct status code for success and each documented failure.
- Request body validation, field bounds, and required/optional fields.
- JSON types and date/decimal serialization.
- Consistent error envelope with no stack trace or SQL details.
- Authentication and ownership enforcement.
- Correct persistence side effects and no side effect on rejected requests.
- OpenAPI operation matches observed behavior.

## 2. Authentication/session

### API-AUTH-001 — Protected endpoint without session
Send a request to a protected endpoint without a valid session.
**Expected:** Documented unauthenticated response; no private data.

### API-AUTH-002 — Invalid/expired session
Send a protected request with an invalid or expired session cookie.
**Expected:** Access denied and no sensitive response.

### API-AUTH-003 — Logout invalidation
Log in, capture the session cookie in a secure test context, log out, then reuse it.
**Expected:** Old session is invalid. Never store captured cookies in logs or artifacts.

### API-AUTH-004 — CSRF token required
For cookie-authenticated state-changing requests, test missing, invalid, and valid CSRF tokens according to the chosen framework configuration.
**Expected:** Invalid/missing token is rejected; valid token allows only an otherwise authorized request.

### API-AUTH-005 — Cookie attributes
Inspect session cookie behavior in the browser/test environment.
**Expected:** `HttpOnly`, `Secure` in HTTPS environments, and an appropriate `SameSite` policy are configured. Exact settings depend on deployment and cross-origin architecture.

## 3. Validation and errors

### API-VAL-001 — Malformed JSON
Send malformed JSON to an endpoint expecting JSON.
**Expected:** Safe 4xx response using the documented error format.

### API-VAL-002 — Missing required field
Omit a required field.
**Expected:** Validation failure identifies the field without exposing internal details.

### API-VAL-003 — Unknown field
Send an extra field.
**Expected:** Behavior follows the documented compatibility policy (reject or ignore); do not let the behavior vary accidentally by endpoint.

### API-VAL-004 — Excessive payload
Send a body larger than the documented limit.
**Expected:** Request is rejected safely without resource exhaustion.

### API-VAL-005 — Unsupported content type
Send a request with an unsupported content type.
**Expected:** Appropriate 4xx response and no mutation.

### API-VAL-006 — Error envelope consistency
Trigger validation, not-found, conflict, forbidden, and unexpected errors.
**Expected:** Error schema and correlation identifier behavior match the documented convention.

## 4. Categories and ownership

### API-CAT-001 — List categories
Call as an authenticated user.
**Expected:** Only categories the user is allowed to see are returned; built-in/custom category distinctions follow the approved model.

### API-CAT-002 — Create duplicate custom category
Submit duplicate or case/whitespace variants.
**Expected:** Result follows the approved normalization and uniqueness policy.

### API-CAT-003 — Cross-user custom category
User B attempts to use, update, or delete a custom category belonging to user A.
**Expected:** No unauthorized access or mutation.

## 5. Transactions

### API-TXN-001 — Valid expense
Submit a valid expense.
**Expected:** Documented success response; exactly one persisted record.

### API-TXN-002 — Invalid amount
Try zero, negative, excessive precision, malformed, and out-of-range values.
**Expected:** Rejected with no persisted transaction.

### API-TXN-003 — Invalid references
Submit a category or income-source identifier that is missing, deleted, or not owned/available to the user.
**Expected:** Rejected according to contract; no data leakage about another user's resources.

### API-TXN-004 — Filter boundaries
Query the documented date/month filters at the lower and upper boundary.
**Expected:** Inclusive/exclusive semantics match OpenAPI/docs and are stable across timezone settings.

### API-TXN-005 — Pagination bounds
If pagination exists, request default, maximum, zero, negative, and excessive page size.
**Expected:** Values are validated or normalized consistently; response is bounded.

### API-TXN-006 — Cross-user read/write
User B requests user A's transaction ID using GET and every applicable mutation method.
**Expected:** No data returned and no mutation; exact 403/404 choice follows the documented policy.

### API-TXN-007 — Soft-delete semantics
If soft delete is approved, verify deleted records are excluded from normal list/aggregates and restoration follows the contract.
**Expected:** All endpoints and aggregates agree.

## 6. Budget and dashboard

### API-BUD-001 — Save valid plan
Submit a valid budget for the permitted period.
**Expected:** Data persists and is returned consistently.

### API-BUD-002 — Duplicate period
Submit a second budget for the same user and period.
**Expected:** Behavior matches the approved uniqueness/update policy; no accidental duplicate.

### API-BUD-003 — Allocation boundary
Test allocations equal to, below, and above planned income after applying the approved savings rule.
**Expected:** Validation or warning behavior follows the business rule exactly.

### API-DASH-001 — Aggregates by user and month
Request dashboard data for a user with deterministic fixtures.
**Expected:** Aggregates match independently calculated expected values and exclude records as specified.

### API-DASH-002 — No data
Request a month with no transactions.
**Expected:** Stable zero/empty response; no 500 error.

### API-DASH-003 — Cross-user aggregate isolation
Authenticate as user B and request all supported filters/parameters.
**Expected:** Response contains only user B's permitted data.

## 7. Insights and reflections

### API-INS-001 — Insufficient history
Request insights for a user below the approved history threshold.
**Expected:** No unsupported result; response follows the approved empty/insufficient-data schema.

### API-INS-002 — Deterministic algorithm
Use fixed fixture dates and amounts around algorithm boundaries.
**Expected:** Same input produces same output and documented explanation.

### API-REF-001 — Reflection ownership
User B attempts to read/update/delete user A's reflection.
**Expected:** No data leakage or mutation.

## 8. Database side effects and reliability

### API-DB-001 — Rejected request has no side effect
Send invalid input, then query the record list/count.
**Expected:** No partial or orphaned data.

### API-DB-002 — Constraint enforcement
Exercise relevant unique and foreign-key constraints through the API or repository integration test.
**Expected:** Invalid state cannot be persisted; errors are safely translated.

### API-DB-003 — Migration repeatability
Apply migrations in a disposable database from the documented starting state.
**Expected:** Migration sequence succeeds. Flyway history is consistent.

### API-REL-001 — Repeated request
Repeat a create request in a controlled way.
**Expected:** Behavior matches the documented duplicate/idempotency policy. Do not assume the server guarantees idempotency unless designed and tested.

## 9. API test reporting

Record request method/path, sanitized input, status, response schema result, database effect, test ID, and outcome. Do not record cookies, passwords, tokens, or real personal financial data.
