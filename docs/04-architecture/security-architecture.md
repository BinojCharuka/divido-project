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

## 10. Current implementation

This section records what the backend does as of DIV-006. It is the verified implementation of §2 and §4, not yet reviewed for public launch. The settings are `DEC-027`, approved by the project owner on 2026-10-28. Sources: `backend/src/main/java/com/divido/security/SecurityConfig.java`, `backend/src/main/resources/application.yml`, and the integration tests named below.

**Authentication** is a server-side servlet session. `POST /api/v1/auth/login` checks the normalized email and password against `app_users` through Spring Security's `DaoAuthenticationProvider` and the delegating password encoder (`{bcrypt}`). An unknown email still runs a bcrypt comparison, so both failures take similar time and get the same `401 INVALID_CREDENTIALS`. On success the session ID is changed (session fixation protection), the CSRF token is replaced, and the security context is saved in the session. The password hash is erased from the in-session principal. Registration never creates a session (`DEC-025`). HTTP Basic and form login are disabled, and no `WWW-Authenticate` challenge is sent.

**Cookies:** with the default (secure) settings, the session cookie is `__Host-DIVIDO_SESSION` and the CSRF cookie is `__Host-XSRF-TOKEN`. Both are `Secure`, `HttpOnly`, `Path=/`, with no `Domain`, and `SameSite=Lax` by default (`SESSION_COOKIE_SAME_SITE`). The `__Host-` prefix makes browsers refuse the cookie unless it has exactly those properties, so another subdomain cannot set or overwrite it (cookie tossing). For local plain HTTP, `SESSION_COOKIE_SECURE=false` switches to `DIVIDO_SESSION` and `XSRF-TOKEN` without `Secure`; nothing else changes. `CookieSettings` derives the names and stops startup if a session cookie name or domain is configured, the path is not `/`, or `SameSite=None` is used without `Secure`. Tracking is cookie-only (no URL session IDs). Idle timeout is 30 minutes (`SESSION_TIMEOUT`). There is no absolute lifetime and no per-user limit on concurrent sessions yet.

**Session store:** Tomcat's in-memory session manager. Sessions are lost on restart or redeploy, and they are not shared between instances, so more than one backend instance needs sticky sessions or a shared store (for example Spring Session JDBC, which would need a new migration). No dependency or migration was added for this.

**Anonymous requests do not create sessions.** The saved-request cache is disabled, and CSRF tokens live in a cookie, not the session.

**Logout** (`POST /api/v1/auth/logout`) requires a session and a CSRF token. It invalidates the session, clears the security context, and expires both cookies, under their configured names, with matching `Path`, `Secure`, `HttpOnly` and `SameSite` attributes. The old session ID is rejected afterwards.

**CSRF:** enabled for every state-changing request, including registration and sign-in. Spring Security's `CookieCsrfTokenRepository` keeps the raw token in the HttpOnly CSRF cookie. `HeaderOnlyXorCsrfTokenRequestHandler` wraps Spring Security's standard `XorCsrfTokenRequestAttributeHandler`:
- `GET /api/v1/auth/csrf` returns the token XOR-masked with fresh random bytes, so it differs on every response. This keeps Spring's BREACH protection for the one response body that carries a token.
- On a state-changing request, the token is read only from the `X-XSRF-TOKEN` header, unmasked and compared in constant time with the cookie. The `_csrf` request-parameter fallback of Spring's standard handlers is removed. Without it, a cross-site HTML form (which cannot set headers) cannot supply a token, even if an attacker managed to plant a known CSRF cookie. The raw cookie value is not accepted in the header.
- CSRF failures get `403 CSRF_INVALID`.

This is Spring's double-submit-cookie pattern: the token is not bound to the session. Its protection rests on the custom header, which cross-origin pages can send only if CORS allows them, and on the `__Host-` cookies.

**SameSite and topology:** `Lax` works when the frontend and API are the same site, which includes `localhost:3000` with `localhost:8080`, a same-origin reverse proxy, or subdomains of one registrable domain. If they are on different sites, the cookies are not sent on `fetch` requests unless `SameSite=None` (which the backend refuses without `Secure`), and third-party-cookie restrictions in browsers may still block them. A same-site or same-origin deployment is strongly preferred. The production topology is still OPEN (§9).

**CORS:** off unless `DIVIDO_CORS_ALLOWED_ORIGINS` lists exact origins. Each entry must be `http://` or `https://` followed by a host and an optional port (at most 65535), with nothing else; `null`, wildcards, missing schemes, paths, trailing slashes, user info and queries stop startup. Listed origins get credentialed CORS on `/api/**` only, for `GET`, `POST`, `PUT`, `PATCH` and `DELETE`, with the `Content-Type` and `X-XSRF-TOKEN` request headers. Requests from other origins get `403` with no CORS headers; origins are never reflected. For local development with the Next.js dev server, set `DIVIDO_CORS_ALLOWED_ORIGINS=http://localhost:3000` and `SESSION_COOKIE_SECURE=false`.

**Public routes:** `/api/v1/health` (returns `{"status":"UP"}`), `/actuator/health` (`show-details: never`; sub-paths such as `/actuator/health/db` are protected), `/error`, `GET /api/v1/auth/csrf`, `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. Everything else, including `/actuator` and unknown `/api/v1/...` paths, requires a session and returns `401 UNAUTHENTICATED` without one.

**Error responses** from the security filters use the API error envelope (`UNAUTHENTICATED`, `CSRF_INVALID`, `FORBIDDEN`).

**No default user:** the application's own user lookup and authentication manager stop Spring Boot from creating its default `user` or logging a generated password.

**Database error detail:** the PostgreSQL driver's `Detail:` text is turned off with `spring.datasource.hikari.data-source-properties.logServerErrorDetail: false`, so values such as a conflicting email don't appear in exception messages or logs.

**Not implemented yet:** rate limiting and account lockout for sign-in and registration (required before public release), an absolute session lifetime, a per-user concurrent-session limit, a shared session store, and a production CORS/topology decision.

**Tests:** `AuthSessionIntegrationTest` (login, current user, logout, CSRF including the form-parameter and cookie-tossing cases), `AuthCookieIntegrationTest` and `AuthCookieLocalHttpIntegrationTest` (cookie names and attributes, rotation and logout on a real embedded Tomcat), `CookieSettingsTest`, `SecurityBaselineIntegrationTest` (public and protected routes, no Basic), `CorsConfigurationIntegrationTest`, `AuthRegistrationIntegrationTest` and `DefaultUserStartupIntegrationTest`.
