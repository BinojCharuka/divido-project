# Non-Functional Requirements

**Status:** Proposed — owner review required

These are proposed quality targets. The team must validate targets against hosting, architecture, privacy expectations, and available test infrastructure before marking them approved.

## 1. Security

### NFR-001 — Server-side authorization
Every protected API operation verifies authentication and ownership for the requested resource. Client-side guards are not security controls.

### NFR-002 — Credential safety
Passwords, if used, are stored only using a maintained password-hashing algorithm and never logged or returned in responses. Password reset and verification tokens must be protected if implemented.

### NFR-003 — Session security
Use secure session practices appropriate to production: HttpOnly cookies, Secure in HTTPS environments, appropriate SameSite policy, session invalidation on logout, expiry, and protection against session fixation. Exact session duration is TBD.

### NFR-004 — CSRF protection
State-changing cookie-authenticated requests must have CSRF protection appropriate to the framework and deployment topology. CORS alone is not CSRF protection.

### NFR-005 — Input validation
Validate input at the API boundary and service/domain layer as appropriate. Never rely solely on browser validation.

### NFR-006 — Data minimization
Collect only data needed for approved features. Do not collect bank credentials or imply bank integration in MVP.

### NFR-007 — Secret management
Secrets must be stored outside source control, excluded from logs, and configured per environment. Never commit `.env` files or production credentials.

### NFR-008 — Abuse resistance
Authentication and recovery endpoints need appropriate rate limiting/abuse controls before public release. Exact thresholds are TBD.

## 2. Privacy and data isolation

### NFR-009 — Tenant isolation
A user must not read, alter, or infer another user's private financial records through IDs, filters, pagination, exports, errors, or timing-sensitive behavior.

### NFR-010 — Safe errors
Public responses must not expose SQL, stack traces, internal hostnames, secrets, or sensitive existence details.

### NFR-011 — Data lifecycle
Document retention, soft deletion, restore, account closure, backups, and permanent purge before production launch. Legal/privacy requirements must be reviewed for intended markets.

### NFR-012 — Logging minimization
Do not log passwords, session identifiers, CSRF tokens, full reflection answers, or unnecessary financial descriptions. Define a safe correlation/request ID approach.

## 3. Reliability and correctness

### NFR-013 — Financial arithmetic
Use decimal-safe arithmetic for money in backend/database code; do not use binary floating-point for authoritative currency calculations. Agree precision/rounding rules before API/database freeze.

### NFR-014 — Consistent calculations
Dashboard, transaction summaries, budgets, and insights must use consistent definitions of eligible records, period boundaries, group mapping, and deletion status.

### NFR-015 — Duplicate prevention
The UI should prevent accidental repeated submissions. Where network retries could create duplicate records, the API design must decide whether idempotency keys or another mechanism are required.

### NFR-016 — Failure recovery
Recoverable network/server failures should produce actionable feedback and preserve safe user-entered values. Do not show success until the backend confirms success.

### NFR-017 — Database migrations
Database changes must be versioned through Flyway migrations. Applied migrations must not be edited; create a new migration for subsequent changes.

## 4. Performance

Proposed targets; confirm after baseline testing:
- NFR-018: Common API reads should aim for p95 under 500 ms under an agreed representative load, excluding network latency beyond the service boundary.
- NFR-019: Common write operations should aim for p95 under 800 ms under an agreed representative load, excluding external network latency.
- NFR-020: Initial usable view should aim for under 3 seconds on a representative mid-range mobile device/network.
- NFR-021: List endpoints must paginate or otherwise bound response size; do not load unlimited transaction history by default.

Targets are not release guarantees until load profile, environment, and measurement method are defined.

## 5. Usability and accessibility

### NFR-022 — Responsive layout
Core tasks must work on narrow mobile widths, tablet, and desktop without loss of functionality.

### NFR-023 — Accessibility
Target WCAG 2.2 AA, following `docs/02-ux-ui/accessibility.md`.

### NFR-024 — Consistent language
Use approved terminology and distinguish planned from actual values across every screen.

### NFR-025 — Form recovery
Validation messages must explain corrections. Preserve entered values after recoverable failures where safe.

## 6. Maintainability and testability

### NFR-026 — Layered responsibilities
Keep presentation, API transport, business rules, and persistence responsibilities separated according to the approved architecture.

### NFR-027 — Automated tests
Business calculations, authorization, validation, and migration-sensitive behavior must have automated tests at suitable levels.

### NFR-028 — API contract
Frontend/backend integration uses documented request/response schemas and a consistent error format. Update API docs and tests whenever behavior changes.

### NFR-029 — Traceability
Implemented stories link to requirements, API contracts, data changes, tests, and PRs.

### NFR-030 — Agent-friendly documentation
AI coding agents must read root `AGENTS.md`, relevant docs index, approved requirements, API/data contracts, and phase plan before changing code. They must not invent missing decisions or edit applied migrations.

## 7. Observability and operations

### NFR-031 — Structured logs
Use structured application logs with levels and correlation IDs; exclude secrets and unnecessary personal/financial content.

### NFR-032 — Health checks
Health endpoints expose only operational information appropriate for their access policy and do not reveal environment secrets or detailed internals.

### NFR-033 — Error monitoring
Define how production exceptions are captured, reviewed, and acted on without leaking user data.

### NFR-034 — Backup and restore
Before production, define database backup frequency, retention, restore testing, and recovery objectives.

## 8. Release gates

Do not approve production release until:
- Authorization tests cover cross-user read and mutation attempts.
- CSRF/session behavior is tested in the deployed topology.
- Secrets are removed from source control and rotated if exposed.
- Database backup/restore process is documented and tested.
- Financial calculations and rounding rules are approved and tested.
- Accessibility and responsive checks pass or have explicitly approved exceptions.
- Monitoring and incident response ownership are defined.
- Retention and account/data deletion policies are approved.
