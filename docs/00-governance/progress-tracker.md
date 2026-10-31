# Divido Master Progress Tracker

**Status:** ACTIVE — Canonical Project Execution Tracker  
**Last Verified Date:** 2026-10-31  
**Single Source of Truth:** `docs/00-governance/progress-tracker.md`

---

## A. Overall Project Status

- **Current Development Phase:** Phase 02 — Transactions (`docs/10-phases/PHASE-02-transactions.md`)
- **Current Milestone:** Milestone 02 — Core Transaction Management & API Integration
- **Current Task ID:** DIV-011 — Transaction Database Schema Migration (V3)
- **Current Task Owners:** 
  - Backend: Project Owner / Claude Code
  - Frontend: Implementation Assistant / Frontend Developer
- **Overall Progress Summary:**
  - **Phase 00 (Planning & Baselines):** Complete. Testcontainers baseline verified and merged (PR #1). Documentation cleanups merged (PR #2, PR #3).
  - **Phase 01 (Foundation & Authentication):** Complete. User registration backend (PR #4), session-cookie auth & CSRF hardening (PR #5), and frontend auth UI/integration with E2E tests (PR #6) are implemented, verified, and merged into `main`.
  - **Phase 02 (Transactions):** In progress. Transaction UI plan merged (PR #7) and UI foundation merged (PR #8). Frontend transaction UI continuation in review (PR #9 on `feature/div-008-frontend-transactions`). PR #9 remains open and requires rework: route-group paths duplicate existing routes from PR #8, branch is diverged from latest main, and test fixtures/PATCH fake-backend coverage need correction. Transaction API contract decisions finalized (DIV-009A). Backend Categories & Income Sources foundation completed with Flyway V2 migration, JPA entities/repositories, services, REST controllers, and 141/141 automated backend tests passing (DIV-010, merged PR #10). Backend transaction persistence and CRUD endpoints are **NEXT** (`DIV-011`, `DIV-013`).
  - **Phases 03–05 (Budgets, Dashboard, Insights, Reflection, Release):** Planned for subsequent phases.

---

## B. Feature Progress Matrix

| Feature | Planning | API Contract | Database Schema | Backend Impl | Backend Tests | Frontend Impl | Frontend Integration | E2E Tests | PR Status | Overall Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Authentication** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | `COMPLETED` | Merged (#4, #5, #6) | `COMPLETED` |
<<<<<<< HEAD
| **Transaction Management** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `NOT_STARTED` | `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `BLOCKED` | Open (#9) | `IN_PROGRESS` |
=======
| **Transaction Management** | `COMPLETED` | `COMPLETED` | `IN_PROGRESS` | `NOT_STARTED` | `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `BLOCKED` | Open (#9) | `IN_PROGRESS` |
>>>>>>> origin/main
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
- **Transactions Schema:** Flyway `V3__transactions.sql` applied; `transactions` table created with constraints (`chk_transactions_type`, `chk_transactions_amount`, `chk_transactions_type_references`), foreign keys (`ON DELETE RESTRICT` on categories/income_sources, `ON DELETE CASCADE` on `app_users`), performance indexes, and no `deleted_at` column (`DEC-014`); 160/160 backend tests passing.
- **Categories:** Flyway `V2__categories_and_income_sources.sql` applied; 3 global default categories seeded (`Groceries`, `Transport`, `Entertainment`); endpoints `GET`, `POST`, `PATCH`, `POST /deactivate` implemented, tested, and merged in PR #10.
- **Income Sources:** Table created in Flyway `V2__categories_and_income_sources.sql`; endpoints `GET`, `POST`, `PATCH`, `POST /deactivate` implemented, tested, and merged in PR #10.
- **Transaction Frontend Integration / E2E:** Blocked pending backend implementation of `/api/v1/transactions` (`DIV-013`).

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
| **DIV-008C** | Transaction UI components & review fixes | 02 | P0 | DIV-008B | Frontend | `IN_REVIEW` | Expense/income forms, edit/delete dialog, filters, formatting and error states; PR #9 still needs route reconciliation, latest-main sync, accurate category fixtures and PATCH fake-backend coverage. |
| **DIV-009A** | Finalize Transaction API contract decisions | 02 | P0 | DIV-008A | Project Owner | `COMPLETED` | Recorded DEC-003, DEC-013, and DEC-014 in canonical decision log; updated `transactions-api.md`, `categories-api.md`, and `openapi.yaml`. |
| **DIV-010** | Backend Categories & Income Sources foundation | 02 | P0 | DIV-009A | Backend (Claude Code) | `COMPLETED` | Flyway V2 migration, category/income-source APIs, ownership protections, 141/141 backend tests passing; merged via PR #10 (squash commit `32b5ba2`). |
| **DIV-011** | Transaction database schema migration (`V3`) | 02 | P0 | DIV-009A, DIV-010 | Backend (Claude Code) | `IN_REVIEW` | Add forward-only Flyway migration for `transactions` table with decimal precision, date, user ownership, and no `deleted_at` column (hard delete per DEC-014). Automated tests in `TransactionSchemaMigrationTest` (160/160 tests passing, PR #11). |
| **DIV-013** | Backend Transaction CRUD APIs & business logic | 02 | P0 | DIV-011, DIV-010 | Backend (Claude Code) | `PLANNED` | Implement `GET /api/v1/transactions`, `POST`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` (hard delete, 204 No Content). |
| **DIV-014** | Backend Transaction integration & isolation tests | 02 | P0 | DIV-013 | Backend (Claude Code) | `PLANNED` | Testcontainers integration tests verifying validation, cross-user isolation, and error responses. |
| **DIV-015** | Frontend-Backend Transaction integration & E2E verification | 02 | P0 | DIV-008C, DIV-014 | Frontend & Backend | `PLANNED` | Connect live frontend forms to real backend endpoints; run full real-browser Playwright journey. |
| **DIV-016** | Reconcile PR #9 routes with `main` & merge PR #9 | 02 | P0 | DIV-008B, DIV-015 | Project Owner | `PLANNED` | Align `app/(app)/transactions` route group with merged PR #8 `app/transactions/`, resolve merge conflicts. |
| **DIV-017** | Budget & Dashboard planning & API contract | 03 | P1 | DIV-016 | Project Owner | `PLANNED` | Define monthly budget allocation and dashboard calculation specifications (Phase 03). |

---

## D. Current Work Breakdown

### Completed
- Phase 00 baseline and Testcontainers setup.
- Phase 01 complete authentication stack (backend registration, session authentication, CSRF hardening, frontend forms, session gate, and E2E tests).
- Phase 02 planning (`phase-02-transaction-ui-plan.md` in PR #7) and UI foundation (PR #8).
- PR #9 scope cleanup completed in commit `ba954e0`: production-routable mock API route removed, out-of-scope modules preserved on `backup/div-008-pre-cleanup`, unused dependency removed, fake-success fallbacks eliminated, and error-state tests expanded. Author-reported lint/typecheck/unit/build/E2E checks passed, but these have not been independently re-run against latest `main`.
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

- **DIV-011 (Transaction Database Schema Migration V3):**
  - Created forward-only Flyway migration `V3__transactions.sql` adding `transactions` table with primary key `gen_random_uuid()`, `user_id REFERENCES app_users(id) ON DELETE CASCADE`, `amount NUMERIC(12,2) CHECK (amount > 0)`, `transaction_date DATE`, `category_id REFERENCES categories(id) ON DELETE RESTRICT`, `income_source_id REFERENCES income_sources(id) ON DELETE RESTRICT`, `description VARCHAR(500)`, `payment_method VARCHAR(50)`, and `created_at`/`updated_at`.
  - Implemented constraints: `chk_transactions_type` (`INCOME`, `EXPENSE`), `chk_transactions_amount` (`amount > 0`), and `chk_transactions_type_references` (`(type = 'EXPENSE' AND category_id IS NOT NULL AND income_source_id IS NULL) OR (type = 'INCOME' AND category_id IS NULL)`).
  - Implemented performance indexes: `idx_transactions_user_date`, `idx_transactions_user_type_date`, `idx_transactions_category_id`, `idx_transactions_income_source_id`.
  - Verified hard deletion per DEC-014; no `deleted_at` column present.
  - Added comprehensive automated test suite `TransactionSchemaMigrationTest` with 19 tests verifying columns, data types, nullability, constraint rejections, foreign key behaviors (`RESTRICT` on category/income-source, `CASCADE` on user), and hard deletion.
  - 160/160 backend tests passing against isolated Testcontainers PostgreSQL. Submitted for review.

### Currently In Progress
- **DIV-011 PR #11 In Review:** Forward-only migration V3 and tests submitted for review in PR #11.
- **PR #9 Review & Reconciliation:** PR #9 is open on `feature/div-008-frontend-transactions`. Current compare: 5 commits ahead / 7 behind `main` (diverged). Route-group paths duplicate existing `frontend/app/transactions/*` URLs. Test fake backend contains 5 default categories although DEC-013 defines exactly 3, and PATCH simulation omits category/income-source changes. Findings posted in PR comment; do not merge until fixed and re-reviewed.
- **Route Alignment with `main`:** PR #8 merged earlier introduced transaction route stubs directly in `frontend/app/transactions/`, while PR #9 placed them under route group `frontend/app/(app)/transactions/`.

### Blocked
- Frontend live integration against backend transactions is **BLOCKED** because backend transaction CRUD endpoints (`/api/v1/transactions`) do not exist yet.

### What Must Be Done Next & Why
- **Next Task:** Review and merge `DIV-011` PR #11, complete PR #9 route reconciliation and review/merge DIV-008, then proceed to `DIV-013 — Backend Transaction CRUD APIs & business logic`.
- **Why:** With Categories and Income Sources fully persisted, tested, and callable on the backend, the backend transaction persistence layer (`transactions` table) is migrated in `V3` and unblocks CRUD APIs implementation and frontend-backend live transaction integration.

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
| **#9** | https://github.com/KasunHerath-dev/divido/pull/9 | `feature/div-008-frontend-transactions` | `main` | `ba954e0` | `OPEN` | Changes Required | Scope cleanup committed; route collisions, branch divergence, category fixture mismatch and PATCH fake-backend coverage remain. |
| **#10** | https://github.com/KasunHerath-dev/divido/pull/10 | `feature/div-010-backend-categories` | `main` | `e59acf5` | `MERGED` | Categories and Income Sources backend foundation; squash merge commit `32b5ba2`. |

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
