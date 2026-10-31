# Traceability Matrix

**Status:** PROPOSED / INITIAL REGISTER  
This matrix will become complete as requirements, UI, APIs, schema, and tests are authored. Do not interpret blank or `OPEN` links as completed design.

| Requirement | User story | Use case | UI | API | Database | Tests | Phase |
|---|---|---|---|---|---|---|---|
| REQ-AUTH-001 Register/sign in | US-001 (AC-001, AC-002); US-002 (AC-003, AC-004) | UC-001; UC-002 | UX-P02 Create account; UX-P01 Sign in | AUTH-001 register (implemented, DIV-005); AUTH-002 sign in, AUTH-003 current user, AUTH-004 sign out, AUTH-006 CSRF token (implemented, DIV-006); frontend `/sign-up`, `/sign-in`, session detection and sign-out (DIV-007, in progress) | `app_users` (V1); in-memory sessions, no schema change (`DEC-027`, approved) | Automated backend: `AuthRegistrationIntegrationTest`, `AuthSessionIntegrationTest`, `AuthCookieIntegrationTest`, `AuthCookieLocalHttpIntegrationTest`, `CookieSettingsTest`, `SecurityBaselineIntegrationTest`, `CorsConfigurationIntegrationTest`. Automated frontend (DIV-007): `frontend/tests/api-client.test.ts`, `frontend/tests/auth-flows.test.tsx` (FE-AUTH-001 to FE-AUTH-004); browser journeys `frontend/e2e/auth.spec.ts` against a local backend. Documented, not yet run: TC-AUTH-001 to TC-AUTH-003, API-AUTH-001 to API-AUTH-005, SEC-001 to SEC-006 | PHASE-01 (entry criteria not yet recorded as met) |
| REQ-TRX-001 Record expense quickly | US-TRX-001 (planned) | UC-TRX-001 (planned) | UI-TRX-001 (planned) | API-TRX-001 (updated per DEC-013 category ownership and DEC-014 hard delete) | DB-TRX-001 (proposed V2) | TEST-TRX-001 (planned) | PHASE-02 |
| REQ-TRX-002 Record income | US-TRX-002 (planned) | UC-TRX-002 (planned) | UI-TRX-002 (planned) | API-TRX-002 (updated per DEC-003 optional income source) | DB-TRX-001 (proposed V2) | TEST-TRX-002 (planned) | PHASE-02 |
| REQ-CAT-001 Use and manage categories | US-CAT-001 (planned) | UC-CAT-001 (planned) | UI-CAT-001 (planned) | API-CAT-001 (updated per DEC-013 3 global defaults and user custom categories) | DB-CAT-001 (`categories` table in V1; V2 seed migration pending defaults) | TEST-CAT-001 (planned) | PHASE-02 |
| REQ-BUD-001 Plan monthly budget | US-BUD-001 (planned) | UC-BUD-001 (planned) | UI-BUD-001 (planned) | API-BUD-001 (proposed) | DB-BUD-001 (proposed) | TEST-BUD-001 (planned) | PHASE-03 |
| REQ-DASH-001 View monthly summary | US-DASH-001 (planned) | UC-DASH-001 (planned) | UI-DASH-001 (planned) | API-DASH-001 (proposed) | Derived from transaction/budget data | TEST-DASH-001 (planned) | PHASE-03 |
| REQ-INS-001 View spending habits | US-INS-001 (planned) | UC-INS-001 (planned) | UI-INS-001 (planned) | API-INS-001 (proposed) | Derived from transactions | TEST-INS-001 (planned) | PHASE-04 |
| REQ-REF-001 Monthly reflection | US-REF-001 (planned) | UC-REF-001 (planned) | UI-REF-001 (planned) | API-REF-001 (proposed) | DB-REF-001 (proposed) | TEST-REF-001 (planned) | PHASE-04 |
| FUT-LEND-001 Track money lent | Not in MVP | Not in MVP | Not in MVP | Not in MVP | Not in MVP | Not in MVP | Future |

## Rules

- Replace planned IDs only after the canonical story/use-case register is authored.
- Every approved story must map to at least one acceptance test.
- A story that spans frontend and backend must identify both sets of tasks and its integration check.
- Update this file whenever a requirement or contract changes.
