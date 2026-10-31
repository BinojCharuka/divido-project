# Divido Master Progress Tracker

**Status:** ACTIVE — Canonical Project Execution Tracker  
**Last Verified Date:** 2026-11-01  
**Single Source of Truth:** `docs/00-governance/progress-tracker.md`

---

## A. Overall Project Status

- **Current Development Phase:** Phase 02 — Transactions (`docs/10-phases/PHASE-02-transactions.md`)
- **Current Milestone:** Milestone 02 — Core Transaction Management & API Integration
- **Current Task ID:** DIV-019 — Backend authentication rate limiting (IN_REVIEW)
- **Current Task Owners:** 
  - Backend: Project Owner / Claude Code
  - Frontend: Implementation Assistant / Frontend Developer
- **Overall Progress Summary:**
  - **Phase 00 (Planning & Baselines):** Complete. Testcontainers baseline verified and merged (PR #1). Documentation cleanups merged (PR #2, PR #3).
  - **Phase 01 (Foundation & Authentication):** Complete. User registration backend (PR #4), session-cookie auth & CSRF hardening (PR #5), and frontend auth UI/integration with E2E tests (PR #6) are implemented, verified, and merged into `main`.
  - **Phase 02 (Transactions):** In progress. Transaction UI plan/foundation (PR #7/#8) and transaction management UI (PR #9) are merged. API contract decisions are finalized (DIV-009A), Categories & Income Sources backend is merged (DIV-010/PR #10), transaction schema V3 is merged (DIV-011/PR #11), transaction CRUD APIs are merged (DIV-013 / PR #12), and transaction integration/isolation verification is complete (DIV-014 / PR #13). Next: complete the backend MVP audit and any required backend-only work under DIV-018 before starting DIV-015 frontend live-API integration and browser E2E tests.
  - **Phases 03–05 (Budgets, Dashboard, Insights, Reflection, Release):** Planned for subsequent phases.

---

## B. Feature Progress Matrix

| Feature | Planning | API Contract | Database Schema | Backend Impl | Backend Tests | Frontend Impl | Frontend Integration | E2E Tests | PR Status | Overall Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Authentication** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Merged (#4, #5, #6) | `COMPLETED` |
| **Transaction Management** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `PLANNED` | `PLANNED` | Backend APIs and verification merged (#12, #13); schema merged (#11), UI merged (#9) | `IN_PROGRESS` |
| **Categories** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `IN_PROGRESS` | `PLANNED` | `PLANNED` | Merged (#10) | `COMPLETED` |
| **Income Sources** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `IN_PROGRESS` | `PLANNED` | `PLANNED` | Merged (#10) | `COMPLETED` |
| **Budget Management** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |
| **Dashboard** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |
| **Insights** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |
| **Reflection** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |
| **Profile & Settings** | `PLANNED` | `PLANNED` | `IN_PROGRESS` | `NOT_STARTED` | `NOT_STARTED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |
| **Onboarding** | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `IN_PROGRESS` | `NOT_STARTED` | `NOT_STARTED` | Merged (#6) | `IN_PROGRESS` |
| **Release Preparation** | `PLANNED` | `PLANNED` | `PLANNED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | `NOT_STARTED` | — | `PLANNED` |

*Notes on sub-statuses:*
- **Transactions Schema:** Flyway `V3__transactions.sql` applied; `transactions` table created with constraints (`chk_transactions_type`, `chk_transactions_amount`, `chk_transactions_type_references`), foreign keys (`ON DELETE RESTRICT` on categories/income_sources, `ON DELETE CASCADE` on `app_users`), performance indexes, and no `deleted_at` column (`DEC-014`); 162/162 backend tests passing.
- **Categories:** Flyway `V2__categories_and_income_sources.sql` applied; 3 global default categories seeded (`Groceries`, `Transport`, `Entertainment`); endpoints `GET`, `POST`, `PATCH`, `POST /deactivate` implemented, tested, and merged in PR #10.
- **Income Sources:** Table created in Flyway `V2__categories_and_income_sources.sql`; endpoints `GET`, `POST`, `PATCH`, `POST /deactivate` implemented, tested, and merged in PR #10.
- **Transaction Frontend Integration / E2E:** Scheduled under DIV-015 after backend MVP completion and approval to proceed with live frontend integration.

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
| **DIV-008C** | Transaction UI components & review fixes | 02 | P0 | DIV-008B | Frontend | `COMPLETED` | Transaction list, expense/income forms, edit/delete flows, filters, formatting and error states; canonical protected routes, DEC-013-aligned fixtures and PATCH fake-backend tests merged via PR #9 (squash commit `3e7a445`). Implementation run reported 74/74 frontend tests and production build passing; live E2E remains under DIV-015. |
| **DIV-009A** | Finalize Transaction API contract decisions | 02 | P0 | DIV-008A | Project Owner | `COMPLETED` | Recorded DEC-003, DEC-013, and DEC-014 in canonical decision log; updated `transactions-api.md`, `categories-api.md`, and `openapi.yaml`. |
| **DIV-010** | Backend Categories & Income Sources foundation | 02 | P0 | DIV-009A | Backend (Claude Code) | `COMPLETED` | Flyway V2 migration, category/income-source APIs, ownership protections, 141/141 backend tests passing; merged via PR #10 (squash commit `32b5ba2`). |
| **DIV-011** | Transaction database schema migration (`V3`) | 02 | P0 | DIV-009A, DIV-010 | Backend (Claude Code) | `COMPLETED` | Added forward-only Flyway V3 migration, schema constraints/indexes, comprehensive Testcontainers migration tests (162/162 backend tests reported passing); merged via PR #11 (squash commit `5a7760f`). |
| **DIV-013** | Backend Transaction CRUD APIs & business logic | 02 | P0 | DIV-011, DIV-010 | Backend (Claude Code) | `COMPLETED` | Implemented all transaction CRUD endpoints, DEC-003 optional income source, DEC-013 category access, DEC-014 hard delete, PATCH presence tracking, pagination/filtering, and Testcontainers integration coverage (176/176 tests reported by implementation run). Merged via PR #12 (squash commit `2f020c05f936b11201884862b5b879a6ab47b0a0`). GitHub Actions/status checks were not reported. |
| **DIV-014** | Backend Transaction integration & isolation test verification | 02 | P0 | DIV-013 | Backend (Claude Code) | `COMPLETED` | Audited `TransactionIntegrationTest` across all 8 matrix areas (A-H). Closed 10 test coverage gaps, strengthened the existing CSRF test across POST/PATCH/DELETE, and added service-level `cleanString` validation tests. 24/24 transaction integration tests and 190/190 full backend suite tests reported passing in isolated Testcontainers PostgreSQL. PR #13 squash-merged (`4c66c71d2977820266d505203f066fb56e3f0a26`); zero Neon access. |
| **DIV-015** | Frontend-Backend Transaction integration & E2E verification | 02 | P0 | DIV-008C, DIV-014 | Frontend & Backend | `PLANNED` | Connect live frontend forms to real backend endpoints; run full real-browser Playwright journey after backend MVP completion. |
| **DIV-016** | Reconcile PR #9 routes with `main` & merge PR #9 | 02 | P0 | DIV-008B | Project Owner | `COMPLETED` | Consolidated transaction routes under `frontend/app/transactions/`, resolved branch sync/review findings, and squash-merged PR #9 (`3e7a445567879ff68a8e13f60d8ad8aba9075b46`). |
| **DIV-017** | Budget & Dashboard planning & API contract | 03 | P1 | DIV-016 | Project Owner | `PLANNED` | Define monthly budget allocation and dashboard calculation specifications (Phase 03). |
| **DIV-018** | Backend MVP completion audit & hardening | 02 | P0 | DIV-014 | Project Owner / Backend (Claude Code) | `COMPLETED` | Audited in-scope MVP backend requirements against implementation, API contracts, security, data integrity, and tests; identified missing work and split approved gaps into small backend-only tasks. Corrected audit report submitted. |
| **DIV-019** | Backend authentication rate limiting | 02 | P0 | DIV-018 | Backend (Claude Code) | `IN_REVIEW` | Implemented in-memory sliding-window rate limiting on `/api/v1/auth/login` and `/api/v1/auth/register` per DEC-022 and DEC-027. Returns HTTP 429 `RATE_LIMIT_EXCEEDED` with `Retry-After` header. Independent per-endpoint and per-client IP limits; trusted proxy validation. 205/205 backend tests passing. |

---

## D. Current Work Breakdown

### Completed
- Phase 00 baseline and Testcontainers setup.
- Phase 01 complete authentication stack (backend registration, session authentication, CSRF hardening, frontend forms, session gate, and E2E tests).
- Phase 02 planning (`phase-02-transaction-ui-plan.md` in PR #7) and UI foundation (PR #8).
- PR #9 scope cleanup and transaction UI implementation completed and merged. The production-routable mock API route and fake-success fallbacks were removed; out-of-scope prototype modules were preserved on `backup/div-008-pre-cleanup`. Route reconciliation, DEC-013 fixtures, PATCH simulation tests, transaction forms/list/edit/delete UI, and loading/error states were merged via PR #9. The implementation run reported lint/typecheck/build success and 74/74 unit tests; live E2E remains deferred to DIV-015 until the backend MVP completion audit and required backend-only work are finished.
- **DIV-009A (Finalize Transaction API Contract Decisions):**
  - Canonical decision log updated with owner-approved decisions (DEC-003, DEC-013, DEC-014).
  - Contract documents updated (`transactions-api.md`, `categories-api.md`, `openapi.yaml`, `seed-data.md`, `data-dictionary.md`).
- **DIV-010 (Backend Categories & Income Sources):**
  - Migration `V2__categories_and_income_sources.sql`: extended `categories` table with `is_active` and `updated_at`, partial unique indexes; seeded 3 global default categories (`Groceries` NEED, `Transport` NEED, `Entertainment` WANT); created `income_sources` table with user ownership referencing `app_users(id)`.
  - Domain entities and enums: `Category`, `IncomeSource`, `KakeiboGroup` enum with JPA `KakeiboGroupConverter` mapping singular DB check values to plural API keys.
  - Repositories: `CategoryRepository`, `IncomeSourceRepository` with user-scoped isolation and uniqueness queries.
  - Services: `CategoryService` (kebab-case slug generation with duplicate counter disambiguation, accent/diacritic normalization, ownership enforcement, immutability of defaults), `IncomeSourceService`.
  - Controllers: `CategoryController` (`GET /api/v1/categories`, `POST`, `PATCH /{id}`, `POST /{id}/deactivate`), `IncomeSourceController` (`GET /api/v1/income-sources`, `POST`, `PATCH /{id}`, `POST /{id}/deactivate`).
  - Error handling: Custom exceptions (`ResourceNotFoundException` -> 404, `ForbiddenOperationException` -> 403, `ConflictException` -> 409, `DataIntegrityViolationException` mapped to 409 Conflict).
  - Independent Backend Review: Verified V1 foreign key referencing `app_users(id)`, safe forward-only schema alterations, strict user isolation across endpoints, CSRF and auth protection, and concurrent duplicate creation safety via `saveAndFlush`.
  - Tests: 141/141 backend tests passing (`KakeiboGroupMappingTest`, `CategorySlugTest`, `CategoryIntegrationTest`, `IncomeSourceIntegrationTest`, `TestDatabaseIsolationTest`). Merged via PR #10 (squash commit `32b5ba29e1d5c8efbabd77b6da1defe5b6e363ea`).

- **DIV-011 (Transaction Database Schema Migration V3) — COMPLETED:**
  - Created forward-only Flyway migration `V3__transactions.sql` adding `transactions` table with primary key `gen_random_uuid()`, `user_id REFERENCES app_users(id) ON DELETE CASCADE`, `amount NUMERIC(12,2) CHECK (amount > 0)`, `transaction_date DATE`, `category_id REFERENCES categories(id) ON DELETE RESTRICT`, `income_source_id REFERENCES income_sources(id) ON DELETE RESTRICT`, `description VARCHAR(500)`, `payment_method VARCHAR(50)`, and `created_at`/`updated_at`.
  - Implemented constraints: `chk_transactions_type` (`INCOME`, `EXPENSE`), `chk_transactions_amount` (`amount > 0`), and `chk_transactions_type_references` (`(type = 'EXPENSE' AND category_id IS NOT NULL AND income_source_id IS NULL) OR (type = 'INCOME' AND category_id IS NULL)`).
  - Implemented performance indexes: `idx_transactions_user_date`, `idx_transactions_user_type_date`, `idx_transactions_category_id`, `idx_transactions_income_source_id`.
  - Verified hard deletion per DEC-014; no `deleted_at` column present.
  - Added comprehensive automated test suite `TransactionSchemaMigrationTest` with 19 tests verifying columns, data types, nullability, constraint rejections, foreign key behaviors (`RESTRICT` on category/income-source, `CASCADE` on user), and hard deletion.
  - 162/162 backend tests passing against isolated Testcontainers PostgreSQL (as reported by the implementation run). PR #11 squash-merged into `main` as `5a7760f7ba1bc0309354cfd0a7d32d1693ab82eb`.

- **DIV-013 (Backend Transaction CRUD APIs & Business Logic) — COMPLETED:**
  - Implemented `Transaction` entity, `TransactionType` enum, DTOs (`TransactionCreateRequest`, `TransactionUpdateRequest`, `TransactionResponse`, `TransactionCategoryResponse`, `IncomeSourceRefResponse`, `TransactionPageResponse`).
  - Added `TransactionRepository` with entity graph eager fetching to prevent N+1 query overhead and user-scoped lookups.
  - Implemented `TransactionService` enforcing: strict authenticated-user scoping, money safety via `BigDecimal` (scale 2 positive amounts), DEC-013 category accessibility (active defaults or active own custom categories), DEC-003 optional income sources (verified ownership and active status), PATCH presence tracking to distinguish omitted fields from explicit nulls, and hard delete per DEC-014.
  - Implemented `TransactionController` with `POST /api/v1/transactions`, `GET /api/v1/transactions`, `GET /{transactionId}`, `PATCH /{transactionId}`, and `DELETE /{transactionId}`.
  - Created `TransactionIntegrationTest` covering CRUD, security/isolation, PATCH semantics, hard delete, category/income-source rules, and money safety.
  - 176/176 backend tests passing against isolated Testcontainers PostgreSQL; merged via PR #12 (squash commit `2f020c05f936b11201884862b5b879a6ab47b0a0`).

- **DIV-014 (Backend Transaction Integration & Isolation Test Verification) — COMPLETED (PR #13):**
  - Audited `TransactionIntegrationTest` across all 8 matrix areas (A through H) against approved transaction API requirements.
  - Identified 10 genuine coverage gaps and 1 defect:
    - Defect fix: In `TransactionService.java`, aligned `cleanString` validation exception field keys to match JSON property names (`"description"`, `"paymentMethod"`). Added focused unit test in `TransactionServiceTest` directly verifying service-level length validation and field keys.
    - Added test `nonexistentReferencesAreRejectedOnCreateAndPatch`: verifies 400 Bad Request with fieldErrors under `categoryId` and `incomeSourceId` on nonexistent/inaccessible references per API validation contract.
    - Added test `patchCannotChangeTransactionType`: verifies that per DEC-026 unknown fields on update DTO are ignored and transaction type remains immutable (`EXPENSE`) in both HTTP response (200 OK) and database via direct JDBC query.
    - Added test `rejectedPatchDoesNotPartiallyModifyData`: verifies atomic rollback on rejected PATCH; persisted record remains unchanged.
    - Added test `rejectedCreateDoesNotPersistAnyRecords`: verifies rejected POST creates zero database rows.
    - Added test `moneySafetyMaxRangeAndMalformedInputs`: verifies maximum supported amount `9999999999.99` accepted, >10 integer digits rejected, and malformed strings rejected with 400.
    - Added test `missingRequiredFieldsAndInvalidTypesOnCreate`: verifies 400 on missing type (with expected field error), missing amount, missing date, or invalid enum.
    - Added test `unknownPropertiesIgnoredAndServerControlledFieldsCannotBeOverridden`: verifies DEC-026 unknown field ignore policy and confirms client cannot override id, userId, or createdAt (verified in both response and direct database queries).
    - Added test `stringLengthBoundariesEnforced`: verifies description boundary (500 ok, 501 rejected) and paymentMethod boundary (50 ok, 51 rejected) on both POST and PATCH.
    - Added test `exactInclusiveDateBoundariesAndCombinedFilters`: verifies inclusive `from` and `to` date boundary filters and multi-criteria combined filtering.
    - Added test `paginationDefaultsAndBoundaries`: verifies default page 0 and size 20, rejects size 0 and size 101, and tests multi-record page navigation, distinct records across pages, and page metadata.
    - Strengthened test `mutatingRequestsRequireCsrf`: verifies CSRF protection on POST, PATCH, and DELETE verbs and rejects invalid CSRF tokens with 403 `CSRF_INVALID`.
  - Repeatability verification: Executed `TransactionIntegrationTest` twice consecutively with 24/24 passing, proving zero order-dependent or flaky test behavior.
  - Full suite verification: Executed `mvn clean test` with 190/190 passing across the entire backend suite.
  - Safety verification: Verified all migrations and tests run exclusively in isolated Testcontainers PostgreSQL (v18.6); verified zero connection to shared Neon database.

### Completed in this milestone
- **DIV-008C / PR #9:** Transaction frontend UI and review fixes merged. Canonical routes are under `frontend/app/transactions/` and protected by `SessionGate` and `AppShell`; fake category fixtures match the three DEC-013 defaults; fake PATCH behavior updates category and income-source references and is covered by tests.

### Completed in this milestone
- **DIV-014 (PR #13):** Transaction integration & isolation test verification. 24/24 integration tests and 190/190 full backend suite tests reported passing in isolated Testcontainers PostgreSQL. PR #13 squash-merged (`4c66c71d2977820266d505203f066fb56e3f0a26`).

### Blocked
- None.

### What Must Be Done Next & Why
- **Next Task:** Begin DIV-018 — Backend MVP Completion Audit & Hardening. Keep DIV-015 (Frontend-Backend Transaction Integration & E2E Verification) planned until the backend audit and required backend work are complete.
- **Why:** DIV-014 is merged and verifies transaction integration/isolation coverage. The project owner wants the backend completed before moving to frontend live integration, so DIV-018 will audit the entire in-scope MVP backend, identify remaining gaps, and plan any required implementation and verification work first.

---

## E. Decision Tracking

All decisions cite canonical IDs from `docs/00-governance/decision-log.md`:

| Decision ID | Topic | Current Decision / Direction | Status | Impact on Phase 02 |
|---|---|---|---|---|
| **DEC-003** | Income sources | Income source is optional for income transactions; creation works without `incomeSourceId`; if provided, backend validates ownership | `APPROVED` (DIV-009A) | In `POST /api/v1/transactions`, `incomeSourceId` is optional; backend validates ownership if present. |
| **DEC-004** | Budget groups | Needs, Wants, Culture, Unexpected (Kakeibo) | `PROPOSED` | Used in `categories` check constraint and frontend badges. |
| **DEC-006** | Expense entry | Quick entry; amount and category first | `PROPOSED` | Reflected in `ExpenseForm.tsx` required fields. |
| **DEC-007** | Payment methods | Manual, optional | `PROPOSED` | Reflected in transaction DTOs and select inputs. |
| **DEC-013** | Category ownership & defaults | Exactly 3 global default categories (`user_id IS NULL`); user custom categories (`user_id = auth_user.id`); defaults immutable | `APPROVED` (DIV-009A) | Usable categories query returns `user_id IS NULL OR user_id = :authUserId`. Exact 3 default names approved and seeded: Groceries (NEED), Transport (NEED), Entertainment (WANT). |
| **DEC-014** | Transaction deletion | Hard delete for MVP (`DELETE /api/v1/transactions/{id}` returns `204 No Content`); permanent removal | `APPROVED` (DIV-009A) | In `DELETE /api/v1/transactions/{id}`, permanently removes row. Restore endpoint `TX-006` removed from MVP. No `deleted_at` column in V2. |
| **DEC-015** | Authentication | Cookie-based server-side session | `APPROVED` (DIV-006) | Enforced on all transaction routes and API requests. |
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
| **#14** | https://github.com/KasunHerath-dev/divido/pull/14 | `feature/div-019-auth-rate-limiting` | `main` | `ee2e749` | `OPEN` | `IN_REVIEW` | DIV-019 authentication rate limiting implementation; address security review findings (right-to-left XFF parsing with IP validation, RateLimitMaintenanceScheduler for automatic bucket eviction, startup configuration validation, production default safety check); 218/218 backend tests passing. |

*Backup Branches:*
- `backup/div-008-pre-cleanup` (SHA `fefe3b0`): Preserves full prototype including future-phase budget, dashboard, categories, and settings code.

---

## G. Status Definitions

- `NOT_STARTED`: Work is specified or backlogged, but no implementation or active preparation has begun.
- `PLANNED`: Requirements, scope, or design are actively being framed; prerequisites are identified.
- `IN_PROGRESS`: Active implementation, testing, or review resolution is under way.
- `BLOCKED`: Work cannot proceed due to an explicit external dependency or unapproved decision.
- `IN_REVIEW`: Code or documentation changes have been submitted via pull request awaiting review.
- `COMPLETED`: Implementation satisfies acceptance criteria, required tests have passed, and changes are merged into `main`.
- `OUT_OF_MVP`: Formally deferred to post-MVP releases.
