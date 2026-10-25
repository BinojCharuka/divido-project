# Security Test Cases

**Status:** Proposed security test inventory — owner/security review required  
**Scope:** MVP web app handling personal financial information

## 1. Safety rules for execution

- Use synthetic accounts and synthetic transactions only.
- Use a test environment, never production, for active attack simulations.
- Do not include secrets, cookies, tokens, passwords, or personal financial details in screenshots or issue comments.
- Obtain explicit authorization before running any security scanner or test against a hosted environment.
- Treat a reproducible unauthorized data access as a release blocker.

## 2. Authentication and session

### SEC-001 — Protected resource without authentication
Call each protected endpoint without a session.
**Expected:** Access is denied and no private data is returned.

### SEC-002 — Invalid or expired session
Use an invalid/expired session cookie.
**Expected:** Access is denied; session does not silently renew without the approved policy.

### SEC-003 — Logout invalidation
Log out and reuse the prior session.
**Expected:** Prior session is invalidated server-side.

### SEC-004 — Session fixation
Where feasible, compare session identifiers before and after authentication.
**Expected:** Authentication rotates or otherwise safely establishes a new session according to framework best practice.

### SEC-005 — Cookie flags
Inspect cookie configuration in HTTPS-like test deployment.
**Expected:** `HttpOnly` is enabled; `Secure` is enabled in HTTPS; `SameSite` is chosen based on actual cross-site needs. Document any exception.

### SEC-006 — Session expiry and renewal
Test idle/absolute expiry and renewal behavior once those policies are approved.
**Expected:** Behavior matches policy and expired sessions cannot access protected resources.

## 3. CSRF and browser boundaries

### SEC-010 — Missing CSRF token
Send a cookie-authenticated state-changing request without the required token.
**Expected:** Request is rejected when CSRF protection is required.

### SEC-011 — Invalid CSRF token
Send an invalid token.
**Expected:** Request is rejected.

### SEC-012 — Valid CSRF token
Send a valid token with an otherwise valid authorized request.
**Expected:** Request may proceed; CSRF protection does not replace authorization.

### SEC-013 — CORS allowlist
Test allowed and disallowed origins.
**Expected:** Only the configured frontend origin(s) are allowed; credentialed CORS is not broadly open to arbitrary origins.

### SEC-014 — Cross-site behavior
Verify cookie `SameSite`, CSRF mechanism, and frontend/API origin configuration together in a real browser. Unit tests alone may not reveal deployment mismatches.

## 4. Authorization and tenant isolation

Use two users, A and B, with records that are easy to distinguish.

### SEC-020 — Read isolation
Authenticate as B and request A's transaction, category, income source, budget, reflection, and any other user-owned resource by ID.
**Expected:** No protected content is returned.

### SEC-021 — Mutation isolation
As B, attempt to update and delete A's records.
**Expected:** No record changes.

### SEC-022 — Forged owner identifier
Submit another user's ID in a request body or query parameter where the client is not meant to choose ownership.
**Expected:** Server ignores/rejects the forged ownership field and derives owner from authenticated context.

### SEC-023 — List/filter isolation
As B, manipulate search, sort, date, pagination, and filter parameters.
**Expected:** All returned rows remain scoped to B.

### SEC-024 — Aggregate isolation
Request dashboard and insight aggregates as B when A has large/distinct values.
**Expected:** No cross-user data influences B's result.

### SEC-025 — Custom-category reference
As B, attempt to attach a transaction to A's private custom category.
**Expected:** Rejected unless the approved model explicitly makes the category shared.

### SEC-026 — ID enumeration
Try sequential or guessed resource IDs in the test environment.
**Expected:** Authorization remains correct regardless of ID predictability; response differences do not expose sensitive metadata unnecessarily.

## 5. Input validation and injection

### SEC-030 — SQL injection strings
Submit harmless SQL-like strings to text fields and filters in the test environment.
**Expected:** Values are treated as data; no query behavior is altered.

### SEC-031 — Script injection / XSS
Submit harmless HTML/script-like payloads to fields that may later be rendered.
**Expected:** Content is safely escaped or rejected according to the approved policy; script does not execute.

### SEC-032 — Oversized input
Send over-limit text and JSON payloads.
**Expected:** Request is bounded and rejected safely without unbounded memory/CPU use.

### SEC-033 — Invalid numeric/date values
Submit negative, extreme, excessive-precision, malformed, or impossible values.
**Expected:** Validation rejects invalid values; no corrupted state is stored.

### SEC-034 — Mass assignment
Attempt to set fields that should be server-controlled (owner ID, system category flag, creation timestamp, role).
**Expected:** Such fields cannot be changed by untrusted clients.

## 6. Error, logging, and secret hygiene

### SEC-040 — Safe errors
Trigger representative failures.
**Expected:** No stack trace, SQL statement, database hostname/password, filesystem path, or secret appears in client response.

### SEC-041 — Log review
Inspect test logs for login, transaction, validation, and server errors.
**Expected:** No password, session cookie, CSRF secret, or unnecessary sensitive financial payload is logged.

### SEC-042 — Secret repository scan
Run the repository's configured secret scan, if available, and inspect environment files and Git history according to the team's approved process.
**Expected:** No active secret is committed. If a secret was exposed, rotate it; deleting a file/commit alone is not enough.

### SEC-043 — Dependency/configuration review
Review dependency alerts and production configuration where tooling exists.
**Expected:** No unreviewed release-blocking known vulnerability or insecure default.

## 7. Data integrity and lifecycle

### SEC-050 — Unauthorized deletion
Try to delete another user's record and verify database state remains unchanged.

### SEC-051 — Soft-delete leakage
If soft delete is approved, verify deleted data is excluded from all applicable APIs, lists, totals, and insights unless restoration/audit behavior explicitly requires visibility.

### SEC-052 — Retention behavior
If retention or permanent deletion is implemented, verify the approved schedule and scope with synthetic records.

### SEC-053 — Migration integrity
Run migrations on a disposable copy of the supported schema; verify records and constraints remain intact.

## 8. Security acceptance gate

Before release, confirm:
- all protected routes require authentication;
- ownership checks exist in the backend/service/data-access path;
- cookie and CSRF behavior is tested in the actual browser setup;
- sensitive values are absent from logs, client bundles, and error responses;
- schema migrations are safe and repeatable in the supported environment;
- no unresolved P0 security issue remains.

This checklist is not a substitute for a professional penetration test if the deployment's risk profile later requires one.
