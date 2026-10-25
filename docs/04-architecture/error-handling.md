# Error Handling Architecture

**Status:** Proposed — align exact response schema with Set 5 API contract

## 1. Goals

Errors should be consistent, safe, actionable, and easy for frontend code to handle. Do not leak internal implementation details.

## 2. Proposed error response

Illustrative schema only; Set 5 must finalize the exact OpenAPI contract.

```json
{
  "timestamp": "2026-10-25T10:15:30Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields.",
  "fieldErrors": {
    "amount": "Enter a valid amount."
  },
  "path": "/api/v1/transactions"
}
```

Do not treat this example's fields as frozen. The final contract must decide whether to include timestamps, request IDs, field error arrays, or other metadata.

## 3. Proposed status mapping

| Condition | Proposed status | UI behavior |
|---|---:|---|
| Invalid request/field validation | 400 | Show field errors and retain input |
| Unauthenticated or expired session | 401 | Explain and offer sign-in |
| Authenticated but not permitted | 403 or safe 404 policy | Show safe unavailable/access message |
| Resource not found | 404 | Show not-found state |
| Business-rule conflict (e.g. duplicate) | 409 | Explain conflict and recovery |
| Request too large | 413 | Explain limit without exposing internals |
| Rate limited | 429 | Ask user to wait before retry |
| Unexpected server error | 500 | Show generic message and correlation ID if available |
| Service temporarily unavailable | 503 | Offer retry where safe |
| Network failure/no response | No HTTP status | Show connection error; don't claim save succeeded |

Exact statuses and error codes are finalized in the API documentation.

## 4. Backend implementation

- Use centralized exception mapping (e.g. Spring `@ControllerAdvice`) consistent with the existing project.
- Map known validation/domain exceptions to stable error codes.
- Log unexpected failures with a correlation ID and safe diagnostic context.
- Return generic client messages for unexpected failures.
- Never return stack traces, SQL, credentials, raw exception messages, or sensitive record details.
- Keep HTTP status and body status fields consistent if both are present.

## 5. Frontend implementation

- Centralize error parsing in the API client.
- Handle JSON and non-JSON error responses safely.
- Distinguish validation, unauthenticated, forbidden/not-found, conflict, rate limit, server, and network errors.
- Show field errors next to fields and a form-level message where useful.
- Preserve form values after recoverable failures.
- Disable repeated submit while pending.
- Do not clear a form or show success without a confirmed successful response.
- Do not automatically retry non-idempotent writes unless the API contract supports safe retry/idempotency.
- Avoid duplicate notifications when both a field error and global error are shown.

## 6. Observability

- Use a request/correlation ID that is safe to show to the user and support team.
- Logs must not include passwords, cookies, CSRF tokens, full financial descriptions, or reflection content by default.
- Keep health-check responses minimal.
- Establish alerting and triage ownership before production.

## 7. Error UX test cases

- Validation error highlights the correct fields.
- Expired session routes to sign-in.
- Network failure retains entered amount/category/description.
- Duplicate submit does not create duplicate records.
- Missing/deleted record displays a safe not-found state.
- Cross-user resource request does not leak private information.
- Unexpected 500 shows a generic message, not a stack trace.
