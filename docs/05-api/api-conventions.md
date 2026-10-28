# API Conventions

**Status:** Proposed — owner approval required

## 1. Base URL and versioning

- Base path: `/api/v1`.
- Use resource-oriented REST endpoints and JSON.
- Use HTTPS outside local development.
- Do not add a version prefix to individual endpoint paths; the version is in the base path.
- Breaking contract changes require review and coordinated frontend/backend updates.

## 2. Authentication and cookies

Implemented in DIV-006 (`DEC-015`; settings are `DEC-027`, approved). Details and the frontend call order are in the [Authentication API](authentication-api.md).

- Protected endpoints use the server-side session cookie `__Host-DIVIDO_SESSION` (HttpOnly, Secure, SameSite=Lax, Path=/, no Domain), set only by `POST /api/v1/auth/login`. With local plain-HTTP settings it is named `DIVIDO_SESSION`. HTTP Basic is not accepted.
- Browser requests must send cookies: `credentials: "include"` for a cross-origin API, or same-origin requests through a proxy. Cross-origin access requires the page origin in the backend's exact allowlist (`DIVIDO_CORS_ALLOWED_ORIGINS`); none is allowed by default.
- Every `POST`, `PUT`, `PATCH` and `DELETE` request must send the masked token from `GET /api/v1/auth/csrf` in the `X-XSRF-TOKEN` header; the browser sends the HttpOnly CSRF cookie. Only the header is checked, never a `_csrf` parameter. This includes public requests such as registration and sign-in.
- Public routes: `GET /api/v1/auth/csrf`, `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `/api/v1/health`, `/actuator/health` and `/error`. Everything else requires a session.
- Sessions expire after 30 minutes without a request (configurable). An expired or signed-out session gets `401 UNAUTHENTICATED`.

## 3. Request/response format

- `Content-Type: application/json` for JSON request bodies.
- Return the created/updated resource or a documented result object after success.
- Use `201 Created` for resource creation where appropriate.
- Use `204 No Content` only when no response body is intentionally returned.
- Avoid returning persistence entities directly.
- Timestamps should use ISO 8601/RFC 3339 with timezone offset or `Z`.
- Date-only fields use `YYYY-MM-DD`.
- Month fields use `YYYY-MM` and represent a calendar month in the approved timezone policy.

## 4. Money representation

**Proposed:** transmit money values as decimal strings, e.g. `"1250.50"`, to avoid JSON binary floating-point ambiguity across JavaScript and Java.

- Database/service calculations use decimal-safe types.
- The API must define allowed scale, maximum amount, and rounding before freeze.
- Never parse formatted UI text such as `"LKR 1,250.50"` as the canonical API value.
- Do not use `double`/`float` for authoritative money calculations.

## 5. Pagination

Proposed query parameters:
- `page`: zero-based integer, default `0`.
- `size`: integer, default `20`, maximum to be decided.
- `sort`: documented allowlisted sort key and direction.

Proposed paged response:
```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

The exact pagination shape may be changed to match existing project conventions, but must be consistent across endpoints.

## 6. Error response

Proposed response:
```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields.",
  "fieldErrors": {
    "amount": "Enter a valid amount."
  },
  "requestId": "safe-correlation-id"
}
```

Contract notes:
- `fieldErrors` may be omitted if there are no field-level errors.
- `requestId` is not emitted yet, because no correlation ID exists.
- Never expose stack traces, SQL, raw exception messages, secret values, or another user's private data.
- Exact fields and status mapping require approval and implementation verification.

Known error codes:

| Code | Status | Meaning | Implementation status |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | One or more fields failed validation; details are in `fieldErrors`. | Implemented (registration) |
| `MALFORMED_REQUEST` | 400 | The request body could not be read, for example invalid JSON. | Implemented (registration) |
| `REGISTRATION_CONFLICT` | 409 | Registration could not complete because the normalized email is already registered. The message is deliberately neutral (`DEC-022`). | Implemented (registration) |
| `INVALID_CREDENTIALS` | 401 | Sign-in failed. Unknown email and wrong password get the same response. | Implemented (sign-in) |
| `UNAUTHENTICATED` | 401 | A protected route was called without a valid session (none, expired, signed out). | Implemented (all protected routes) |
| `CSRF_INVALID` | 403 | The `X-XSRF-TOKEN` header is missing, malformed, or does not match the CSRF cookie. | Implemented (all state-changing requests) |
| `FORBIDDEN` | 403 | Signed in but not permitted. No current route produces it. | Implemented (security error handler) |

The `401` and `403` responses produced by the security filters use this envelope too, and no `WWW-Authenticate` header is sent. Other framework errors, such as `405` or `415`, still use the framework's default body.

## 7. Proposed status codes

| Status | Use |
|---|---|
| 200 | Successful read/update or action returning a body |
| 201 | Resource created |
| 204 | Successful action with no response body |
| 400 | Invalid request/field validation |
| 401 | Missing/expired authentication |
| 403 | Authenticated but not permitted, if chosen by policy |
| 404 | Resource absent or intentionally hidden |
| 409 | Domain conflict or duplicate |
| 413 | Request too large |
| 415 | Unsupported media type |
| 429 | Rate limited |
| 500 | Unexpected server error |
| 503 | Temporarily unavailable |

Use one consistent safe policy for resources that exist but belong to another user (403 vs 404) and document it.

## 8. Validation and naming

- JSON field names use `camelCase`.
- Enum values are stable documented strings.
- Unknown request fields are ignored, not rejected (`DEC-026`). Server-controlled values such as IDs and owner IDs are never read from the request body. Several proposed request schemas in `openapi.yaml` still declare `additionalProperties: false`. They must be reconciled with this rule when their endpoints are implemented.
- Validate at both API and domain boundaries.
- Field errors should use stable request field names.
- Text length limits, allowed characters, amount rules, and future-date rules must be approved.

## 9. Idempotency and retries

- Frontend disables repeat submit while pending.
- Do not automatically retry non-idempotent POST requests unless safe retry/idempotency behavior is explicitly designed.
- Decide whether transaction creation requires an `Idempotency-Key` before production.

## 10. Open decisions before freeze

- Exact base URL per environment.
- Production CORS origins and deployment topology (same-origin proxy or separate origins).
- Decimal scale/max and whether money is represented as strings in all endpoints.
- Pagination response format and max page size.
- Exact error schema/status mapping.
- Date-only versus timestamp semantics for transactions.
- Idempotency requirements.
