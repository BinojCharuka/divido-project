# Divido Master Progress Tracker

**Status:** ACTIVE — Canonical Project Execution Tracker  
**Last Verified Date:** 2026-11-04  
**Single Source of Truth:** `docs/00-governance/progress-tracker.md`

---

## A. Overall Project Status

- **Current Development Phase:** Phase 02 — Transactions is `COMPLETED` (PR #16, merge commit `0a898a0`, verified on `main` 2026-11-04). Next: Phase 03 — Budget & Dashboard, starting with the DIV-017 decision gate.
- **Current Milestone:** Milestone 02 — Core Transaction Management: `COMPLETED`. **Next Milestone (not started, awaiting owner go-ahead):** Milestone 03 — Budget & Dashboard planning and API contract decisions (DIV-017)
- **Current Active Tasks:** None. Phase 03 has not started; `DIV-017` (`PLANNED`) is the first Phase 03 task and awaits the project owner's go-ahead.
- **Current Task Owners:** 
  - Backend: Project Owner / Claude Code
  - Frontend: Implementation Assistant / Frontend Developer
- **Overall Progress Summary:**
  - **Phase 00 (Planning & Baselines):** Complete. Testcontainers baseline verified and merged (PR #1). Documentation cleanups merged (PR #2, PR #3).
  - **Phase 01 (Foundation & Authentication):** Complete. User registration backend (PR #4), session-cookie auth & CSRF hardening (PR #5), and frontend auth UI/integration with E2E tests (PR #6) are implemented, verified, and merged into `main`.
  - **Phase 02 (Transactions):** Complete. DIV-015, DIV-020, DIV-021 and DIV-024 merged via PR #16 (merge commit `0a898a0`). Earlier: Transaction UI foundation (PR #7, #8) and management UI (PR #9) are merged. API contract decisions are finalized (DIV-009A), Categories & Income Sources backend foundation is merged (DIV-010 / PR #10), transaction schema V3 is merged (DIV-011 / PR #11), transaction CRUD APIs are merged (DIV-013 / PR #12), transaction integration/isolation verification is complete (DIV-014 / PR #13), backend MVP completion audit is complete (DIV-018), and authentication rate limiting is merged (DIV-019 / PR #14).
  - **Reconciliation Audit (2026-11-02) — historical:** Corrected premature `COMPLETED` statuses for Budget, Dashboard, Insights, Reflection, Profile/Settings and Onboarding to `NOT_STARTED` / `DECISION_REQUIRED`, and added task cards DIV-020 through DIV-035. Its findings on the Categories and Income Sources frontends and its "next: DIV-015" step are superseded by PR #16 (2026-11-04), which delivered DIV-015, DIV-020, DIV-021 and DIV-024.
  - **Phase 02 completion audit (2026-11-04):** `main` at `cf13e39` was broken: four transaction route files contained committed merge-conflict markers (typecheck/build failed), and commit `4569144` had mounted the Figma prototype (`features/prototype/FigmaApp.tsx`) on every production route, including transactions, categories, income sources, dashboard and budget. The prototype keeps transactions in `localStorage`, falls back to sample data on API failure and swallows category/income-source mutation errors (`.catch(() => {})`). Branch `feature/div-015-phase-02-completion` restores the real PR #9 transaction routes, builds real `/categories` and `/income-sources` management pages, completes filters, fixes a PATCH bug where cleared optional fields were silently kept, replaces Phase 03+ prototype routes with honest "not available yet" pages, and limits `/prototype` to development builds. Verified on the branch, merged via PR #16 (merge commit `0a898a0`), and re-verified on `main` (see Section B notes).
  - **Phases 03–05 (Budgets, Dashboard, Insights, Reflection, Release):** Planned for subsequent phases per canonical dependency order.

---

## B. Feature Progress Matrix

| Feature | Planning | API Contract | Database Schema | Backend Impl | Backend Tests | Frontend Impl | Frontend Integration | E2E Tests | PR Status | Overall Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Authentication** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Merged (#4, #5, #6); rate limiting merged (#14, DIV-019) | `COMPLETED` |
| **Transaction Management** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Backend merged (#11–#13); UI (#9); real routes restored, edit/filter fixes and live E2E merged (#16) | `COMPLETED` |
| **Categories** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Backend merged (#10); `/categories` management UI merged (#16); defaults per DEC-013 (approved 2026-11-04) | `COMPLETED` |
| **Income Sources** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Backend merged (#10); `/income-sources` management UI merged (#16) | `COMPLETED` |
| **Budget Management** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED / DECISION_REQUIRED` |
| **Dashboard** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `NOT_STARTED` |
| **Insights** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `DECISION_REQUIRED` |
| **Reflection** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `DECISION_REQUIRED` |
| **Profile & Settings** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `NOT_STARTED / DECISION_REQUIRED` |
| **Onboarding** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | Placeholder route only | `PLACEHOLDER / NOT_STARTED` |
| **Release Preparation** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |

*Notes on sub-statuses:*
- **Post-merge verification on `main` at `0a898a0` (2026-11-04):** `npm run typecheck` PASS; `npm run test` 100/100 PASS; `npm run build` PASS; `./mvnw verify` 284/284 PASS (Testcontainers, exit 0); `npm run test:e2e` 15/15 PASS against a local backend on a disposable `postgres:18-alpine` container (register/login rate limits raised via env vars for the run). `npm run lint`: 8 errors that predate PR #16, all outside Phase 02 (`features/prototype/FigmaApp.tsx` 6, `lib/api/dashboard.ts` 1, `lib/api/insights.ts` 1), plus 15 warnings. GitHub ran no checks: the repository has no CI workflows (see DIV-031) and `main` has no branch protection.
- **DIV-015 branch, before merge (2026-11-04):** Verification commands and results: `npm run typecheck` PASS; `npm run test` 100/100 PASS; `npm run build` PASS; `npm run lint` FAIL only on pre-existing files outside Phase 02 (`features/prototype/FigmaApp.tsx`, `lib/api/dashboard.ts`, `lib/api/insights.ts`) — Phase 02 files lint clean; `./mvnw verify` 284/284 PASS (Testcontainers); `npm run test:e2e` 15/15 PASS (7 auth + 8 Phase 02 journeys) against a local backend on a disposable `postgres:18-alpine` container, with register/login rate limits raised via env vars for the run. No Neon access.
- **Transaction Management:** Flyway `V3__transactions.sql` applied; transaction CRUD endpoints (`GET /api/v1/transactions`, `POST`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`) and Testcontainers isolation tests merged (DIV-013 / PR #12, DIV-014 / PR #13). Frontend list, expense/income creation, edit and hard delete use the live API behind the session gate (PR #9, restored and fixed in PR #16). Live frontend–backend integration and real-browser Playwright journeys are complete (DIV-015 / PR #16; 15/15 on `main`).
- **Categories:** Flyway `V2__categories_and_income_sources.sql` applied; 3 global default categories seeded and approved (DEC-013: `Groceries` → NEED, `Transport` → NEED, `Entertainment` → WANT); backend `GET`, `POST`, `PATCH`, `POST /deactivate` merged (PR #10). Frontend API client methods (`createCategory`, `updateCategory`, `deactivateCategory`) and the protected `/categories` management page are merged (DIV-020 / PR #16): defaults are read-only, custom categories can be created, renamed/regrouped and deactivated.
- **Income Sources:** Table created in Flyway `V2__categories_and_income_sources.sql`; backend `GET`, `POST`, `PATCH`, `POST /deactivate` merged (PR #10). Frontend API client methods (`createIncomeSource`, `updateIncomeSource`, `deactivateIncomeSource`) and the protected `/income-sources` management page with rename, deactivate confirmation and an `includeInactive` toggle are merged (DIV-021 / PR #16). Income source remains optional (DEC-003).
- **Transaction Filters:** Month, type, category and income source filters are wired to `GET /api/v1/transactions`, with "Clear filters", reset to page 0, and filtered-empty and error states (DIV-024 / PR #16).
- **Budget, Dashboard, Insights, Reflection, Profile & Settings:** No controller, service, entity, or Flyway V4 schema migration exists in `main`. Marked as `NOT_STARTED` / `DECISION_REQUIRED` until decision gates, schemas, contracts, and implementation are approved.
- **Onboarding:** Route `frontend/app/onboarding/page.tsx` exists as a placeholder only. Backend currently always returns `onboardingComplete: false`. Full multi-step stepper flow scheduled under DIV-023.

---

## C. Task Backlog

| Task ID | Title | Phase | Priority | Dependencies | Owner | Status | Description & Acceptance Summary |
|---|---|---|---|---|---|---|---|
| **DIV-001** | Repository baseline audit | 00 | P0 | None | Project Owner | `COMPLETED` | Initial repository structure and dependency inspection. |
| **DIV-002** | Read-only shared database verification | 00 | P0 | DIV-001 | Project Owner | `COMPLETED` | Verified Neon PostgreSQL schema and Flyway baseline without schema changes. |
| **DIV-003** | Isolated Testcontainers test baseline | 00 | P0 | DIV-002 | Project Owner | `COMPLETED` | Added Testcontainers PostgreSQL test baseline for isolated test execution (PR #1). |
| **DIV-004** | Documentation cleanup (B1 & B2) | 00 | P1 | DIV-001 | Project Owner | `COMPLETED` | Documentation index reconciliation (PR #2) and canonical decision log setup (PR #3). |
| **DIV-005** | Backend registration endpoint | 01 | P0 | DIV-003 | Backend (Claude Code) | `COMPLETED` | Implemented `POST /api/v1/auth/register` with validation, normalization, and integration tests (PR #4). |
| **DIV-006** | Backend session authentication & CSRF | 01 | P0 | DIV-005 | Backend (Claude Code) | `COMPLETED` | Implemented login, session restoration, logout, and XOR-masked CSRF protection (PR #5). |
| **DIV-007** | Frontend authentication & session integration | 01 | P0 | DIV-006 | Frontend | `COMPLETED` | Sign-in, sign-up, sign-out, session restore, CSRF integration, Vitest & Playwright E2E tests (PR #6). |
| **DIV-008A** | Transaction UI plan documentation | 02 | P0 | DIV-007 | Frontend | `COMPLETED` | Authored Phase 02 transaction UI component and delivery plan (PR #7). |
| **DIV-008B** | Transaction UI foundation | 02 | P0 | DIV-008A | Frontend | `COMPLETED` | Added AppShell, navigation, route frame, and initial transaction stubs (PR #8). |
| **DIV-008C** | Transaction UI components & review fixes | 02 | P0 | DIV-008B | Frontend | `COMPLETED` | Transaction list, expense/income forms, edit/delete flows, filters, formatting and error states; canonical protected routes, DEC-013-aligned fixtures and PATCH fake-backend tests merged via PR #9 (squash commit `3e7a445`). Implementation run reported 74/74 frontend tests and production build passing; live E2E was later completed under DIV-015 (PR #16). |
| **DIV-009A** | Finalize Transaction API contract decisions | 02 | P0 | DIV-008A | Project Owner | `COMPLETED` | Recorded DEC-003, DEC-013, and DEC-014 in canonical decision log; updated `transactions-api.md`, `categories-api.md`, and `openapi.yaml`. |
| **DIV-010** | Backend Categories & Income Sources foundation | 02 | P0 | DIV-009A | Backend (Claude Code) | `COMPLETED` | Flyway V2 migration, category/income-source APIs, ownership protections, 141/141 backend tests passing; merged via PR #10 (squash commit `32b5ba2`). |
| **DIV-011** | Transaction database schema migration (`V3`) | 02 | P0 | DIV-009A, DIV-010 | Backend (Claude Code) | `COMPLETED` | Added forward-only Flyway V3 migration, schema constraints/indexes, comprehensive Testcontainers migration tests (162/162 backend tests reported passing); merged via PR #11 (squash commit `5a7760f`). |
| **DIV-013** | Backend Transaction CRUD APIs & business logic | 02 | P0 | DIV-011, DIV-010 | Backend (Claude Code) | `COMPLETED` | Implemented all transaction CRUD endpoints, DEC-003 optional income source, DEC-013 category access, DEC-014 hard delete, PATCH presence tracking, pagination/filtering, and Testcontainers integration coverage (176/176 tests reported by implementation run). Merged via PR #12 (squash commit `2f020c05f936b11201884862b5b879a6ab47b0a0`). |
| **DIV-014** | Backend Transaction integration & isolation test verification | 02 | P0 | DIV-013 | Backend (Claude Code) | `COMPLETED` | Audited `TransactionIntegrationTest` across all 8 matrix areas (A-H). Closed 10 test coverage gaps, strengthened CSRF test across POST/PATCH/DELETE, and added service-level `cleanString` validation tests. 24/24 transaction integration tests and 190/190 full backend suite tests reported passing in isolated Testcontainers PostgreSQL. PR #13 squash-merged (`4c66c71d2977820266d505203f066fb56e3f0a26`); zero Neon access. |
| **DIV-015** | Frontend-Backend Transaction integration & live E2E verification | 02 | P0 | DIV-008C, DIV-014 | Frontend & Backend | `COMPLETED` | Connect live frontend forms to real backend endpoints using dedicated local test environment/Testcontainers; run full real-browser Playwright journeys covering expense creation, sourced/sourceless income, filtering, editing, hard delete, cross-user isolation, session expiry, and CSRF retry. Execution commands, commit and results are recorded in Section B notes. Merged via PR #16 (merge commit `0a898a0b8fd0a018b115cb13cd48e986476496fb`); verified on `main`. |
| **DIV-016** | Reconcile PR #9 routes with `main` & merge PR #9 | 02 | P0 | DIV-008B | Project Owner | `COMPLETED` | Consolidated transaction routes under `frontend/app/transactions/`, resolved branch sync/review findings, and squash-merged PR #9 (`3e7a445567879ff68a8e13f60d8ad8aba9075b46`). |
| **DIV-017** | Budget & Dashboard planning & API contract decisions | 03 | P0 | DIV-016 | Project Owner | `PLANNED` | Formulate and approve calculation rules (planned income, recorded income, savings target, group budget remaining), decimal precision, month/timezone boundaries, and OpenAPI contracts (Phase 03). |
| **DIV-018** | Backend MVP completion audit & hardening | 02 | P0 | DIV-014 | Project Owner / Backend (Claude Code) | `COMPLETED` | Audited in-scope MVP backend requirements against implementation, API contracts, security, data integrity, and tests; identified missing work and split approved gaps into small backend-only tasks. Corrected audit report submitted. |
| **DIV-019** | Backend authentication rate limiting | 02 | P0 | DIV-018 | Backend (Claude Code) | `COMPLETED` | Implemented in-memory sliding-window rate limiting on `/api/v1/auth/login` and `/api/v1/auth/register` per DEC-022 and DEC-027. Returns HTTP 429 `RATE_LIMIT_EXCEEDED` with `Retry-After` header. Independent per-endpoint and per-client IP limits; right-to-left trusted proxy validation; atomic bucket lifecycle; DNS-free IP parsing; scheduled idle-bucket cleanup. 284/284 backend tests reported passing. Merged via PR #14 (merge commit `81dabf6a919bd72f606c3a341f032de6fd9f5bd9`). GitHub Actions workflow runs/status checks were not present for the merge commit. |
| **DIV-020** | Category management frontend UI & API integration | 02 | P1 | DIV-010 | Frontend | `COMPLETED` | Add `createCategory`, `updateCategory`, and `deactivateCategory` to API client; build protected `/categories` (or `/settings/categories`) management view; visually distinguish 3 global defaults from custom categories; disable mutation controls on defaults; handle duplicate slug/name conflicts gracefully; refresh transaction category selectors on mutation; add component and integration tests. Merged via PR #16 (merge commit `0a898a0b8fd0a018b115cb13cd48e986476496fb`); verified on `main`. |
| **DIV-021** | Income source management frontend UI & API integration | 02 | P1 | DIV-010 | Frontend | `COMPLETED` | Add `createIncomeSource`, `updateIncomeSource`, and `deactivateIncomeSource` to API client; build protected `/income-sources` (or `/settings/income-sources`) management view; support rename, deactivate confirmation, and `includeInactive=true` toggle; refresh transaction income source selectors; add component and integration tests. Merged via PR #16 (merge commit `0a898a0b8fd0a018b115cb13cd48e986476496fb`); verified on `main`. |
| **DIV-022** | Profile preferences vertical slice & schema | Pending owner re-phasing | P1 | Project Owner Decision Gate | Full-Stack | `NOT_STARTED / DECISION_REQUIRED` | Decision Gate: Approve editable fields, allowed locales/currencies/timezones, and onboarding completion contract (`GET/PATCH /api/v1/profile`). Add forward-only Flyway migration for persisted profile attributes; implement backend DTOs, service, controller, and isolation tests; build protected `/settings/profile` page with loading, validation, and saved states; add live two-user ownership E2E test. |
| **DIV-023** | Guided onboarding stepper flow | Pending owner re-phasing | P1 | DIV-022, DIV-025 | Full-Stack | `NOT_STARTED / DECISION_REQUIRED` | Decision Gate: Approve mandatory vs skippable steps, saved draft behavior, and completion rule. Replace `/onboarding` placeholder with multi-step stepper (Preferences -> Income Sources -> Initial Budget Plan -> Review/Complete); enforce backend completion tracking; handle session expiry, draft recovery, and redirect logic; cover resume and completion with browser E2E tests. |
| **DIV-024** | Transaction filter UI completion | 02 | P2 | DIV-008C | Frontend | `COMPLETED` | Extend `TransactionFilters.tsx` to include Category and Income Source dropdown controls; wire selected filter IDs to `listTransactions`; implement "Clear filters" action; reset pagination to page 0 on filter change; verify empty and filtered states. Merged via PR #16 (merge commit `0a898a0b8fd0a018b115cb13cd48e986476496fb`); verified on `main`. |
| **DIV-025** | Budget management schema, API & UI implementation | 03 | P0 | DIV-017 | Full-Stack | `PLANNED / DECISION_REQUIRED` | Decision Gate: Approve month/timezone policy, decimal precision, zero/missing allocations, and over-allocation warning vs block rule. Create forward Flyway migration for monthly budget table with unique `(user_id, month)` constraint; implement `GET /api/v1/budgets/{month}` and `PUT /api/v1/budgets/{month}`; build monthly-plan UI distinguishing planned vs actual allocations with over-allocation warnings; verify with integration and E2E tests. |
| **DIV-026** | Dashboard aggregation API, UI & reconciliation tests | 03 | P0 | DIV-025, DIV-015 | Full-Stack | `NOT_STARTED` | Implement `GET /api/v1/dashboard?month=YYYY-MM` with user-scoped aggregates for planned income, recorded income, savings target, group budgets, and remaining balances. Build dashboard summary cards, group progress bars, month navigation, and empty states using server totals only; verify reconciliation rule (API amounts == UI amounts == fixture amounts). |
| **DIV-027** | Spending insights scope decision & implementation | 04 | P2 | Project Owner Decision Gate, DIV-015 | Full-Stack | `DECISION_REQUIRED` | Decision Gate: Decide whether Spending Insights belongs to MVP. If approved: define 90-day lookback window, minimum 3 distinct spending days threshold, non-judgmental wording guidelines, and privacy safeguards; implement backend rule engine and `GET /api/v1/insights`; build dashboard insight cards with insufficient-data states; add unit and E2E coverage. |
| **DIV-028** | Monthly reflection scope decision & implementation | 04 | P2 | Project Owner Decision Gate, DIV-025 | Full-Stack | `DECISION_REQUIRED` | Decision Gate: Decide whether Monthly Reflection belongs to MVP. If approved: define reflection question IDs, max length, retention/deletion policy; create Flyway schema migration; implement `GET/PUT /api/v1/reflections/{month}`; build monthly reflection form with retry/recovery UX; add ownership and E2E tests. |
| **DIV-029** | Account recovery & verification policy | 00 | P2 | Project Owner Decision Gate | Full-Stack | `DECISION_REQUIRED / OUT_OF_CURRENT_SLICE` | Decision Gate: Explicit product/security decision on password reset mechanism. Define identifier, verification channel (email/token), token hashing, short expiry (e.g. 15m), single-use invalidation, rate limits, and timing-attack-safe neutral error responses; build reset UI and security tests. (Marked `OUT_OF_CURRENT_SLICE` until approved). |
| **DIV-030** | Release preparation: Production configuration & topology | 05 | P1 | None | DevOps / Backend | `PLANNED` | Configure production hosting environment, exact allowed CORS origins, HTTPS redirection, strict cookie attributes (`__Host-` cookies, Secure, HttpOnly, SameSite=Lax), least-privilege Neon database roles, and secure secret store. Verify zero dev-only configurations in production profile. |
| **DIV-031** | Release preparation: CI/CD pipeline & automated release gates | 05 | P1 | None | DevOps | `PLANNED` | Implement automated CI/CD pipeline running backend unit/integration tests (`mvn clean test`), frontend linting, typechecking, and build (`npm run build`); define deterministic release artifact tagging, migration execution order before app startup, and automated rollback triggers. |
| **DIV-032** | Release preparation: Structured observability & health probes | 05 | P1 | None | DevOps / Backend | `PLANNED` | Implement structured JSON logging excluding sensitive data (PII, credentials, financial details); configure error monitoring and alerts; add Spring Boot Actuator health/readiness/liveness probes; define log access and retention controls. |
| **DIV-033** | Release preparation: Database backup & restore drill | 05 | P1 | None | DevOps / Database | `PLANNED` | Define recovery point objective (RPO) and recovery time objective (RTO); execute an end-to-end database restore drill into a staging/test environment using synthetic data; record verification evidence and designate emergency recovery authority. |
| **DIV-034** | Release preparation: Release QA gate, security & accessibility audit | 05 | P0 | DIV-015, DIV-026 | QA / Security | `PLANNED` | Execute regression test suite, verify security checklist (authentication, CSRF, isolation, rate limiting, SQL injection defense), run automated WCAG 2.1 AA accessibility checks, test mobile responsiveness, and perform post-deployment smoke test. |
| **DIV-035** | Release preparation: Data lifecycle, retention & account purge | 05 | P1 | None | Backend / Product | `PLANNED` | Document and implement user account deletion policy (`DELETE /api/v1/profile` or admin purge), cascading data cleanup, retention periods for financial logs, and data export capability; verify with synthetic test data. |

---

## D. Current Work Breakdown

### Completed
- Phase 00 baseline and Testcontainers setup.
- Phase 01 complete authentication stack (backend registration, session authentication, CSRF hardening, frontend forms, session gate, and E2E tests).
- Phase 02 planning (`phase-02-transaction-ui-plan.md` in PR #7) and UI foundation (PR #8).
- PR #9 scope cleanup and transaction UI implementation completed and merged (`3e7a445`). The production-routable mock API route and fake-success fallbacks were removed; out-of-scope prototype modules were preserved on `backup/div-008-pre-cleanup`. Route reconciliation, DEC-013 fixtures, PATCH simulation tests, transaction forms/list/edit/delete UI, and loading/error states were merged via PR #9.
- **DIV-009A (Finalize Transaction API Contract Decisions):** Canonical decision log updated with owner-approved decisions (DEC-003, DEC-013, DEC-014); contract documents updated (`transactions-api.md`, `categories-api.md`, `openapi.yaml`, `seed-data.md`, `data-dictionary.md`).
- **DIV-010 (Backend Categories & Income Sources):** Flyway V2 migration applied, seeded 3 defaults (`Groceries`, `Transport`, `Entertainment`), implemented user-scoped categories and income-sources CRUD/deactivate endpoints, 141/141 backend tests passing; merged via PR #10 (`32b5ba2`).
- **DIV-011 (Transaction Database Schema Migration V3):** Created forward-only Flyway migration `V3__transactions.sql`, constraints, indexes, hard delete per DEC-014, and 19 migration tests; 162/162 backend tests passing; merged via PR #11 (`5a7760f`).
- **DIV-013 (Backend Transaction CRUD APIs & Business Logic):** Implemented all transaction CRUD endpoints, DEC-003 optional income source, DEC-013 category access, DEC-014 hard delete, PATCH presence tracking, pagination/filtering, and Testcontainers integration coverage; 176/176 tests passing; merged via PR #12 (`2f020c0`).
- **DIV-014 (Backend Transaction Integration & Isolation Test Verification):** Audited `TransactionIntegrationTest` across all 8 matrix areas (A-H), closed 10 test coverage gaps, strengthened CSRF tests, and added `cleanString` validation tests. 24/24 transaction integration tests and 190/190 full backend suite tests passing; merged via PR #13 (`4c66c71`).
- **DIV-018 (Backend MVP Completion Audit & Hardening):** Completed comprehensive audit of in-scope MVP backend requirements against implementation, security, and tests.

- **DIV-015, DIV-020, DIV-021, DIV-024 (Phase 02 completion) — merged via PR #16 (merge commit `0a898a0`):**
  - Resolved the committed merge-conflict markers and restored the real transaction routes (list, new expense, new income, edit) behind the session gate. `instant = false` stays on the server `transactions/layout.tsx`; Next.js 16 does not allow `instant` in Client Component pages.
  - Removed the Figma prototype from all production routes. `/prototype` now returns 404 in production builds unless `NEXT_PUBLIC_ENABLE_PROTOTYPE=true`, and shows a "sample data only" banner. `/dashboard`, `/budget`, `/insights`, `/reflection` and `/settings` show protected "not available yet" pages instead of locally stored or sample figures. The sign-in card no longer links to the prototype dashboard.
  - Built `/categories` (defaults read-only; create, rename/regroup and deactivate custom categories; show inactive) and `/income-sources` (create, rename, deactivate; show inactive). The UI updates only after the server confirms a change.
  - Filters: month, type, category and income source sent to `GET /api/v1/transactions`; "Clear filters"; reset to page 0; filtered empty state; error state with retry. Category filter hidden for income, income-source filter hidden for expenses.
  - Edit fix: PATCH now sends only changed fields, and sends `null` to clear optional fields (description, payment method, income source). Before, a cleared field was dropped from the JSON, so the backend kept the old value while the UI said "Transaction updated."
  - A delete that returns 404 no longer shows "Transaction deleted."; it says the transaction no longer exists.
  - Removed the unused `TransactionForm.tsx` stub, the filters' fake disabled controls, and their stale test (`tests/transaction-ui.test.tsx`).
  - Added `tests/management.test.tsx` and `e2e/transactions.spec.ts`.
- **DEC-013 default categories:** names and mappings approved by the project owner on 2026-11-04 and recorded in `decision-log.md` (PR #16).

### Currently In Progress / In Review
- None.

### Blocked
- None.

### Decision Required
- **Re-phase DIV-022 and DIV-023:** both were tagged Phase 02 but are decision-gated, outside the scope of `PHASE-02-transactions.md`, and DIV-023 depends on DIV-025 (Phase 03). Their phase is shown as "Pending owner re-phasing" in Section C until the owner decides; their status is unchanged. They do not block Phase 02 completion.
- **Month/timezone date policy (part of the DIV-025 decision gate):** the `PHASE-02-transactions.md` test-gate item "date filtering follows approved timezone/month rules" is only partially met. Inclusive date-only boundaries are verified, but no month/timezone policy is approved, and the frontend uses the browser's local date for "current month". Recorded as conditional, not as a defect.

### What Must Be Done Next & Why
1. **DIV-017 (Phase 03 decision gate):** Phase 03 has not started. When the owner opens it, the first step is to approve budget/dashboard calculation rules, precision, month/timezone boundaries and OpenAPI contracts before any Phase 03 implementation.
2. **DIV-031 (CI):** the repository has no CI workflows, so PR checks are run locally only.

---

## E. Decision Tracking

All decisions cite canonical IDs from `docs/00-governance/decision-log.md`:

| Decision ID | Topic | Current Decision / Direction | Status | Impact on Phase 02 |
|---|---|---|---|---|
| **DEC-001** | Target audience | Individual users; shared finances deferred | `PROPOSED` | Single-user scoping across all entities |
| **DEC-002** | Onboarding | Guided onboarding; multi-step stepper | `PROPOSED` | Framework for DIV-023 |
| **DEC-003** | Income sources | Income source is optional for income transactions; creation works without `incomeSourceId`; if provided, backend validates ownership | `APPROVED` (DIV-009A) | In `POST /api/v1/transactions`, `incomeSourceId` is optional; backend validates ownership if present. |
| **DEC-004** | Budget groups | Needs, Wants, Culture, Unexpected (Kakeibo) | `PROPOSED` | Used in `categories` check constraint and frontend badges. |
| **DEC-005** | Money accounts | One overall money view; no account balances | `PROPOSED` | No bank aggregation or balance tracking |
| **DEC-006** | Expense entry | Quick entry; amount and category first | `PROPOSED` | Reflected in `ExpenseForm.tsx` required fields. |
| **DEC-007** | Payment methods | Manual, optional | `PROPOSED` | Reflected in transaction DTOs and select inputs. |
| **DEC-008** | Savings | Monthly savings target | `PROPOSED` | Used in budget planning and dashboard |
| **DEC-009** | Initial language | English only for MVP; localization deferred | `PROPOSED` | No Sinhala or multilingual UI in MVP |
| **DEC-010** | Shared expenses | Outside MVP | `PROPOSED` | Excluded from current scope |
| **DEC-011** | Spending habits | Analyze 90 days; minimum three distinct spending days | `PROPOSED` | Governs conditional Insights feature (DIV-027) |
| **DEC-012** | Budget allocation | Independent limits; warn if plan exceeds planned income after savings | `PROPOSED` | Warning behavior in monthly budget form |
| **DEC-013** | Category ownership & defaults | Exactly 3 global default categories (`user_id IS NULL`); user custom categories (`user_id = auth_user.id`); defaults immutable | `APPROVED` (DIV-009A) | Usable categories query returns `user_id IS NULL OR user_id = :authUserId`. Exact defaults approved by the project owner on 2026-11-04 and seeded in V2: Groceries (NEED), Transport (NEED), Entertainment (WANT). Defaults are immutable; custom user categories remain supported. |
| **DEC-014** | Transaction deletion | Hard delete for MVP (`DELETE /api/v1/transactions/{id}` returns `204 No Content`); permanent removal | `APPROVED` (DIV-009A) | Permanently removes row. Restore endpoint `TX-006` removed from MVP. No `deleted_at` column in V3. |
| **DEC-015** | Authentication | Cookie-based server-side session | `APPROVED` (DIV-006) | Enforced on all transaction routes and API requests. |
| **DEC-016** | Money lending tracker | Outside MVP | `PROPOSED` | Excluded from current scope |
| **DEC-020** | Income planning | Planned income and actual income records | `PROPOSED` | Used in monthly budget plan |
| **DEC-021** | Display name | Required 1–100 chars at registration | `APPROVED` | Implemented in DIV-005. |
| **DEC-022** | Conflict response | HTTP 409 `REGISTRATION_CONFLICT` | `APPROVED` | Implemented in DIV-005. |
| **DEC-023** | Email normalization | Trim and lowercase with `Locale.ROOT` | `APPROVED` | Implemented in DIV-005/006. |
| **DEC-025** | Sign-in at registration | Separate sign-in after registration | `APPROVED` | Implemented in DIV-005/007. |
| **DEC-026** | Unknown request fields | Ignored, not rejected; server-controlled fields ignored | `APPROVED` | Applies to transaction request DTOs. |
| **DEC-027** | Session, cookie & CSRF | 30m idle timeout, `X-XSRF-TOKEN` header, `__Host-` cookies | `APPROVED` | Required for all state-changing transaction mutations. |

---

## F. Pull Request & Git Tracking

| PR # | URL | Head Branch | Base Branch | Latest Commit SHA | Merge Status | Review Status | Notes |
|---|---|---|---|---|---|---|---|
| **#1** | https://github.com/KasunHerath-dev/divido/pull/1 | `feature/div-003-test-baseline` | `main` | `c9d6168` | `MERGED` | Approved | Backend Testcontainers test baseline. |
| **#2** | https://github.com/KasunHerath-dev/divido/pull/2 | `docs/div-004-b1-index-status` | `main` | `8dc04b4` | `MERGED` | Approved | Documentation index and status cleanup. |
| **#3** | https://github.com/KasunHerath-dev/divido/pull/3 | `docs/div-004-b2-decision-register` | `main` | `3fabfd9` | `MERGED` | Approved | Canonical decision register setup. |
| **#4** | https://github.com/KasunHerath-dev/divido/pull/4 | `feature/div-005-registration` | `main` | `5b84174` | `MERGED` | Approved | Backend user registration endpoint. |
| **#5** | https://github.com/KasunHerath-dev/divido/pull/5 | `feature/div-006-authentication` | `main` | `1f83888` | `MERGED` | Approved | Backend session auth and CSRF hardening. |
| **#6** | https://github.com/KasunHerath-dev/divido/pull/6 | `feature/div-007-frontend-auth` | `main` | `21c9e3c` | `MERGED` | Approved | Frontend auth integration and E2E tests. |
| **#7** | https://github.com/KasunHerath-dev/divido/pull/7 | `docs/transaction-ui-plan` | `main` | `e77ee6f` | `MERGED` | Approved | Phase 02 transaction UI delivery plan. |
| **#8** | https://github.com/KasunHerath-dev/divido/pull/8 | `feature/transaction-ui-foundation` | `main` | `68d7b53` | `MERGED` | Approved | Transaction UI foundation & AppShell. |
| **#9** | https://github.com/KasunHerath-dev/divido/pull/9 | `feature/div-008-frontend-transactions` | `main` | `161b60f` | `MERGED` | Approved | Transaction management UI, protected routes, DEC-013-aligned test fixtures and PATCH fake-backend coverage; squash merge commit `3e7a445567879ff68a8e13f60d8ad8aba9075b46`. |
| **#10** | https://github.com/KasunHerath-dev/divido/pull/10 | `feature/div-010-backend-categories` | `main` | `e59acf5` | `MERGED` | Categories and Income Sources backend foundation; squash merge commit `32b5ba2`. |
| **#11** | https://github.com/KasunHerath-dev/divido/pull/11 | `feature/div-011-transaction-schema` | `main` | `ca75db6` | `MERGED` | V3 transactions schema migration and Testcontainers tests; squash merge commit `5a7760f`. |
| **#12** | https://github.com/KasunHerath-dev/divido/pull/12 | `feature/div-013-backend-transactions` | `main` | `a511fbb` | `MERGED` | Static review completed; squash merge commit `2f020c05f936b11201884862b5b879a6ab47b0a0`. 176/176 Testcontainers tests reported by implementation run; no GitHub Actions/status checks reported. |
| **#13** | https://github.com/KasunHerath-dev/divido/pull/13 | `test/div-014-transaction-coverage` | `main` | `dbf5e9c` | `MERGED` | DIV-014 transaction integration/isolation verification; squash merge commit `4c66c71d2977820266d505203f066fb56e3f0a26`. 24/24 transaction integration tests and 190/190 full suite tests reported passing; no GitHub CI status checks reported. |
| **#16** | https://github.com/KasunHerath-dev/divido/pull/16 | `feature/div-015-phase-02-completion` | `main` | `6cc12ab` | `MERGED` | Self-reviewed; no required reviews or checks configured | DIV-015/020/021/024 Phase 02 completion and DEC-013 approval; merge commit `0a898a0b8fd0a018b115cb13cd48e986476496fb`. No GitHub checks ran (no CI workflows); local verification on `main` recorded in Section B. |
| **#14** | https://github.com/KasunHerath-dev/divido/pull/14 | `feature/div-019-auth-rate-limiting` | `main` | `81dabf6` | `MERGED` | Reviewed and merged | DIV-019 authentication rate limiting; resolved review findings (atomic per-key bucket lifecycle, strict DNS-free IP parsing, trusted-proxy right-to-left handling, startup validation, and scheduled cleanup). 284/284 backend tests reported passing. Merge commit `81dabf6a919bd72f606c3a341f032de6fd9f5bd9`; no GitHub Actions workflow runs/status checks were present. |

*Backup Branches:*
- `backup/div-008-pre-cleanup` (SHA `fefe3b0`): Preserves full prototype including future-phase budget, dashboard, categories, and settings code.
- `backup/unapproved-v4-prototype-20261102`: Preserves local prototype experiments and unapproved V4 migration stubs.

---

## G. Implementation Dependency Graph

```text
Tracker/Doc Reconciliation + Requirement Decisions
    ├── Category & Income Source Management UI (DIV-020, DIV-021) — COMPLETED (PR #16)
    ├── Transaction Filter UI & Live E2E (DIV-024, DIV-015) — COMPLETED (PR #16)
    └── Profile & Preferences API (DIV-022) — phase pending owner re-phasing
           ↓
       Budget Rules + Budget API/UI (DIV-017, DIV-025)
           ↓
       Dashboard API/UI + Reconciliation Tests (DIV-026)
           ↓
       Onboarding Completion Flow (DIV-023)
           ↓
       Insights & Reflections (only if approved for MVP) (DIV-027, DIV-028)
           ↓
       Release Configuration, CI/CD, Observability, QA & Security Gates (DIV-030 to DIV-035)
```

---

## H. Scope Boundaries & Superseded Requirements

The following requirements and proposals are explicitly superseded or declared out of MVP scope per canonical decision records. They must not be reintroduced as active implementation tasks without formal project owner approval:

1. **Transaction Soft-Delete and Restoration:** Superseded by **DEC-014**. The MVP enforces permanent hard deletion (`DELETE /api/v1/transactions/{id}` returns `204 No Content`). Soft-delete mechanisms, restore endpoints (`TX-006`), and `deleted_at` schema columns are excluded.
2. **Automatic Sign-In After Registration:** Superseded by **DEC-025**. Registration creates an account only; the user is redirected to sign in with their credentials.
3. **Mandatory Income Source:** Superseded by **DEC-003**. `incomeSourceId` is optional for income transactions.
4. **Money Lending & Debt Tracking:** Defined as future work in **DEC-016**; excluded from MVP.
5. **Bank Account Aggregation & Balances:** Excluded by **DEC-005** and **DEC-007**. Divido operates on manual entry; no bank scraping or provider integration.
6. **Shared Household Collaboration:** Excluded by **DEC-001** and **DEC-010**. Scope is strictly limited to single-user finance.
7. **Recurring Transactions & Subscriptions:** Excluded from MVP; manual transaction entry only.
8. **Sinhala & Multilingual Localization:** Excluded by **DEC-009**. English is the sole supported language for the MVP.

---

## I. Status Definitions

- `NOT_STARTED`: Work is specified or backlogged, but no implementation or active preparation has begun.
- `PLANNED`: Requirements, scope, or design are actively being framed; prerequisites are identified.
- `IN_PROGRESS`: Active implementation, testing, or review resolution is under way.
- `BLOCKED`: Work cannot proceed due to an explicit external dependency.
- `IN_REVIEW`: Code or documentation changes have been submitted via pull request awaiting review.
- `COMPLETED`: Implementation satisfies acceptance criteria, required tests have passed, and changes are merged into `main`.
- `DECISION_REQUIRED`: Work is blocked pending an explicit product, architecture, or security decision from the project owner.
- `OUT_OF_MVP`: Formally deferred to post-MVP releases.
