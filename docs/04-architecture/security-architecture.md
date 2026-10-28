# Security Architecture

**Status:** Proposed baseline — security review required before public launch

## 1. Security objectives

- Protect personal financial records from cross-user access.
- Protect authentication sessions and credentials.
- Prevent cross-site request forgery in cookie-authenticated requests.
- Avoid leaking secrets or private data through logs, errors, and configuration.
- Make secure behavior testable.

## 2. Authentication and sessions

Proposed approach: server-managed session, browser cookie marked HttpOnly, Secure in HTTPS production, and an appropriate SameSite setting. Exact choices depend on deployment topology.

Requirements:
- Use maintained Spring Security mechanisms; do not implement cryptography/session tokens from scratch.
- Invalidate server-side session on logout.
- Set idle/absolute expiry according to an approved policy.
- Rotate session ID at authentication to prevent session fixation.
- Do not put session identifiers in localStorage or expose them to JavaScript.
- Protect registration, login, and recovery endpoints against brute-force abuse.
- Never log passwords, cookies, session IDs, or reset tokens.

Spring Session JDBC is a candidate for persistence across backend restarts/instances; verify dependency compatibility with the project's Spring Boot version and operational requirements before adopting it.

## 3. Authorization and data isolation

For every resource endpoint:
1. Authenticate the request.
2. Resolve current user from the trusted security context.
3. Scope lookup/mutation by both resource identifier and current user.
4. Return safe 403/404 behavior according to the API policy.
5. Test cross-user access explicitly.

Do not trust `userId` from request bodies, query parameters, route parameters, or frontend state as proof of identity.

## 4. CSRF, CORS, and cookies

Because cookies are sent automatically by browsers, state-changing requests need a CSRF strategy.

- Keep CSRF enabled for cookie-authenticated state changes unless a reviewed architecture proves an alternative is appropriate.
- Define how the frontend obtains and sends the CSRF token.
- Allow only exact trusted frontend origins in CORS configuration.
- Never combine wildcard origins with credentialed CORS.
- Configure cookie domain, path, SameSite, Secure, and expiry deliberately.
- Test the actual local, staging, and production origins; localhost behavior can differ from deployed behavior.

## 5. Transport and secrets

- Use HTTPS in deployed environments.
- Keep database credentials and application secrets out of source control.
- Exclude `.env` and local secret files in `.gitignore`.
- Use environment/secret-manager configuration appropriate to the host.
- Rotate credentials if they were ever committed, shared in a public place, or exposed in logs.
- Do not include secret values in screenshots, issue reports, logs, or documentation.

## 6. Input and output safety

- Validate and constrain request payloads.
- Use parameterized database access/ORM safely.
- Render user-supplied text as text, not executable HTML.
- Validate URL/redirect destinations; do not permit open redirects.
- Do not expose stack traces, SQL messages, internal hostnames, or framework diagnostics to clients.
- Apply appropriate limits to descriptions, category names, and request sizes after owner approval.

## 7. Privacy and financial data

- Collect only fields needed for approved product functionality.
- Avoid logging transaction descriptions or reflection answers by default.
- Do not store bank credentials or implement bank sync in MVP.
- Define data retention, account closure, export, backup, and permanent deletion policies before public release.
- Restrict access to production data and use synthetic data for routine testing.

## 8. Security test checklist

- Unauthenticated request to every protected endpoint.
- User A attempts to read/update/delete User B's transaction/category/plan/reflection.
- CSRF token missing/invalid on state-changing request.
- Invalid CORS origin and credentialed request behavior.
- Session fixation/session ID rotation after authentication.
- Logout followed by reuse of old session cookie.
- Expired session.
- Oversized/invalid input and malformed JSON.
- Sensitive fields absent from logs and error payloads.
- Secrets absent from repository history and build artifacts.

## 9. Deployment-dependent open decisions

- Same-origin proxy versus separate origins.
- Exact cookie SameSite/domain/path settings.
- Session idle and absolute expiry.
- CSRF token transport.
- CORS allowlist.
- Login/recovery rate limits and account lockout policy.
- Data retention and account deletion requirements.

## 10. Current implementation (interim, not the target design)

This section records what the backend does today, as of DIV-005. It is **not** the approved target architecture described above, and it is **not production-ready**. Source: `backend/src/main/java/com/divido/security/SecurityConfig.java` and `backend/src/main/resources/application.yml`.

**Public routes** are handled by a separate filter chain with no HTTP Basic, so an `Authorization` header on them is ignored:
- `/api/v1/health`: only `GET` is implemented; it returns `{"status":"UP"}`.
- `/actuator/health`: `show-details: never`. The response may also list probe group names (`liveness`, `readiness`) but no component details. Sub-paths such as `/actuator/health/db` are protected.
- `/error`.
- `POST /api/v1/auth/register` only. Other methods on that path are protected.

**Everything else** requires authentication. That includes `/actuator`, other actuator endpoints (only `health` is exposed), and unknown `/api/v1/...` paths. Unauthenticated requests get `401` with a `WWW-Authenticate: Basic` challenge.

**HTTP Basic, with no users:** the user lookup is a placeholder that finds no accounts, so no one can sign in yet and every Basic attempt gets `401`. Defining it also disables Spring Boot's generated default user, so no generated password is created or logged.

**Sessions and CSRF:** sessions are stateless and CSRF is disabled on both filter chains. No session or cookie is created, including at registration. There is no CORS configuration.

**Passwords** are hashed with Spring Security's delegating password encoder (bcrypt, `{bcrypt}` prefix).

**Database error detail:** the PostgreSQL driver's `Detail:` text is turned off with `spring.datasource.hikari.data-source-properties.logServerErrorDetail: false`. Values such as a conflicting email therefore don't appear in exception messages or logs; the constraint name still does.

All of this is replaced or revisited by the approved session, CSRF and CORS design in DIV-006 (`DEC-015`, `DEC-024`, `DEC-025`).
