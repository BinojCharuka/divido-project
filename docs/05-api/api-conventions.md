# API Conventions

**Status:** Proposed — owner approval required

## 1. Base URL and versioning

- Base path: `/api/v1`.
- Use resource-oriented REST endpoints and JSON.
- Use HTTPS outside local development.
- Do not add a version prefix to individual endpoint paths; the version is in the base path.
- Breaking contract changes require review and coordinated frontend/backend updates.

## 2. Authentication and cookies

- Protected endpoints use the approved server-side session cookie.
- Browser requests must use the credential mode required by the selected deployment topology.
- State-changing requests must include the approved CSRF token/header.
- Exact cookie name, CSRF header name, session expiry, SameSite and CORS rules must be confirmed in security configuration.
- Authentication endpoints and health endpoints are public only as explicitly configured.

**Interim authentication (current implementation, not the target):** protected routes are configured for HTTP Basic, but no application user lookup exists yet, so no account can sign in and every protected route returns `401`. The intended design remains the server-side session cookie described above (`DEC-015`, `DEC-024`). CSRF, CORS and session behaviour must be resolved as part of the approved authentication design in DIV-006. Do not infer them from the target architecture or from the interim configuration. See [Security architecture — current implementation](../04-architecture/security-architecture.md#10-current-implementation-interim-not-the-target-design).

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

Responses produced by the framework rather than the API, such as `401` on protected routes, do not use this envelope yet. Their exact body has not been verified in a real servlet container.

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
- Session cookie/CSRF details and CORS topology.
- Decimal scale/max and whether money is represented as strings in all endpoints.
- Pagination response format and max page size.
- Exact error schema/status mapping.
- Date-only versus timestamp semantics for transactions.
- Idempotency requirements.
