# Decision Log

**Status:** PROPOSED — records discussed decisions, not a final freeze

Use this file to distinguish explicit choices from recommendations and unresolved questions.

## Register scope

This is the canonical decision register for Divido. A `DEC-*` ID cited anywhere in the documentation refers to the entry in this file.

[`01-product/scope-and-decisions.md`](../01-product/scope-and-decisions.md) is a supporting product summary, not a register. Its decision table predates this log and numbers the same topics differently, so one `DEC-*` number can mean different decisions in the two files. For example, `DEC-007` is *Payment methods* here but *Categories* there. Those historical IDs are kept unchanged, and the summary maps each one to its canonical entry below.

- Cite only the IDs in this file.
- `DEC-017` to `DEC-019` appear only in the supporting summary's historical table. They are not assigned here and must not be reused.
- New decision IDs continue sequentially from the highest ID in this table (currently `DEC-027`).

| ID | Topic | Current decision or proposal | Status | Notes |
|---|---|---|---|---|
| DEC-001 | Target audience | Individual users | PROPOSED | Shared household collaboration is deferred |
| DEC-002 | Onboarding | Guided onboarding | PROPOSED | Exact fields and screens need UX review |
| DEC-003 | Income sources | Income source is optional for income transactions. Income creation works without `incomeSourceId`; if provided, backend validates ownership by the authenticated user | APPROVED | Approved by the project owner on 2026-10-31 (DIV-009A). Supersedes earlier requirement that income records must always reference a source |
| DEC-004 | Budget groups | Needs, Wants, Culture, Unexpected | PROPOSED | Confirm category mapping in UX/data set |
| DEC-005 | Money accounts | One overall money view; no account balances | PROPOSED | Not a bank/account aggregation feature |
| DEC-006 | Expense entry | Quick entry; amount and category first | PROPOSED | Optional details should not block save |
| DEC-007 | Payment methods | Manual, optional | PROPOSED | No bank or payment provider integration |
| DEC-008 | Savings | Monthly savings target | PROPOSED | Formula and dashboard presentation need definition |
| DEC-009 | Initial language | English | PROPOSED | Localization can be future work |
| DEC-010 | Shared expenses | Outside MVP | PROPOSED | Future scope |
| DEC-011 | Spending habits | Analyze 90 days; minimum three distinct spending days | PROPOSED | Regularity algorithm still needs definition |
| DEC-012 | Budget allocation | Independent limits; warn if plan exceeds planned income after savings | PROPOSED | Exact warning copy and calculations need definition |
| DEC-013 | Category ownership & defaults | Exactly 3 shared global default categories (`user_id IS NULL`). Users can create custom categories (`user_id` set to authenticated user). Users can use global defaults and own custom categories. Global categories are immutable to users. Cross-user custom category access/mutation is prohibited. The 3 defaults and their Kakeibo groups are: (1) `Groceries` → `NEED`, (2) `Transport` → `NEED`, (3) `Entertainment` → `WANT` (API values `NEEDS`/`WANTS`) | APPROVED | Ownership model approved by the project owner on 2026-10-31 (DIV-009A). Exact default names and mappings approved by the project owner on 2026-11-04; they match the rows already seeded by the applied `V2__categories_and_income_sources.sql`, so no migration change is needed. V1 `categories.user_id` is nullable. User-owned custom categories remain supported |
| DEC-014 | Transaction deletion | Hard delete for MVP. `DELETE /api/v1/transactions/{id}` permanently deletes the record and returns HTTP `204 No Content`. Deleted transactions are no longer retrievable. Users cannot delete another user's transactions | APPROVED | Approved by the project owner on 2026-10-31 (DIV-009A). Supersedes proposed soft delete with restore; restore endpoint `TX-006` is removed from MVP |
| DEC-015 | Authentication | Cookie-based server-side session using maintained framework | APPROVED | Approved by the project owner on 2026-10-28; implemented in DIV-006 and hardened in DIV-006A (PR #5) |
| DEC-016 | Money lending tracker | Future feature, outside MVP | PROPOSED | Search by username/phone and repayment records later |
| DEC-020 | Income planning | Planned income and actual income records | PROPOSED | Recorded from historical `DEC-009` in the product scope summary; exact calculation and display remain open |
| DEC-021 | Registration display name | `displayName` is required at registration; trimmed, 1–100 characters | APPROVED | Approved by the project owner on 2026-10-28. Matches the V1 `display_name NOT NULL` column |
| DEC-022 | Duplicate registration response | HTTP `409` with neutral code `REGISTRATION_CONFLICT` and message "We couldn't create an account with these details." | APPROVED | Approved by the project owner on 2026-10-28. Implemented in DIV-005. The `409` status still reveals that an account exists; rate limiting is needed before public release |
| DEC-023 | Email normalization | Trim and lower-case the entire email with `Locale.ROOT` before validation and storage; future login must use the same normalization | APPROVED | Approved by the project owner on 2026-10-28. The V1 unique constraint is case-sensitive; a later `lower(email)` unique index is a possible follow-up |
| DEC-024 | Interim authentication documentation | Session-cookie authentication (`DEC-015`) remains the target. Docs describe the current interim HTTP Basic configuration separately, and the OpenAPI global scheme stays `sessionCookie` | APPROVED | Approved by the project owner on 2026-10-28. DIV-006 replaced the interim HTTP Basic configuration with session-cookie authentication, so the interim documentation it covered has been retired |
| DEC-025 | Sign-in at registration | Registration does not sign the user in. `POST /api/v1/auth/register` creates the account without a session; the frontend then sends the user to the sign-in page, and sign-in is a separate request | APPROVED | Approved by the project owner on 2026-10-28. Supersedes UC-001 step 5 and the session clause of AC-001 |
| DEC-026 | Unknown request fields | Ignored, not rejected; server-controlled fields such as IDs are never read from the request | APPROVED | Approved by the project owner on 2026-10-28. Applied to registration and sign-in. Some proposed OpenAPI schemas for unimplemented endpoints still declare `additionalProperties: false` |
| DEC-027 | Session, cookie and CSRF settings | (1) In-memory servlet session, 30-minute idle timeout, session ID changed at sign-in. (2) Secure deployments: cookies `__Host-DIVIDO_SESSION` and `__Host-XSRF-TOKEN`, both `Secure`, `HttpOnly`, `Path=/`, no `Domain`, `SameSite=Lax` by default; local plain HTTP (`SESSION_COOKIE_SECURE=false`) uses `DIVIDO_SESSION` and `XSRF-TOKEN` without `Secure`; incompatible settings stop startup. (3) CSRF: Spring Security's XOR-masked token, returned by `GET /api/v1/auth/csrf` and accepted only in the `X-XSRF-TOKEN` header, never as a `_csrf` parameter. (4) CORS off unless exact `http(s)://host[:port]` origins are configured; `null`, wildcards and malformed entries stop startup | APPROVED | Approved by the project owner on 2026-10-28. Implemented in DIV-006 and hardened in DIV-006A after the security review. Sessions do not survive restarts or span instances. No absolute session lifetime or per-user concurrent-session limit yet. Rate limiting is still required before public release. Production topology remains open |

## Decision rules

- A `PROPOSED` item is not approved merely because it appears here.
- Record the approver and date when a decision is explicitly approved.
- If a decision is rejected, preserve its history and record the replacement decision.
- Security and database decisions must be reflected in their detailed design documents before implementation.
