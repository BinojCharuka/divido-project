# Divido — Summary of Recent Changes (Last 3 Days)

**Period:** November 16, 2026 – November 19, 2026  
**Repository Branch:** `main`  
**Current Commit:** `c8fac22`

---

## 📌 Executive Summary

Over the last 3 days, Divido underwent significant feature additions, database schema upgrades, and a complete UI transformation. Key milestones achieved include:
1. **Full-Stack Phase 04 Features:** Spending Insights, Monthly Reflections, Profile & Account Lifecycle, Guided Onboarding, and Password Recovery.
2. **Production Figma UI Activation:** Promoted the modern Figma dark-theme design across all application routes and eliminated legacy UI prototypes.
3. **Database Migrations V6 & V7:** Successfully migrated the PostgreSQL database on Neon through Flyway V6 (`reflections`) and V7 (`account lifecycle`).
4. **UI Polishing & Customizations:** Styled transaction buttons (Red for Expense, Green for Income), fixed mobile navigation, removed user avatar dropdown chevrons, and cleaned up legacy "Kakeibo" terminology.

---

## 🚀 1. Feature Implementations (Full-Stack)

### A. Spending Insights (DIV-027 / PR #28)
* **Backend:**
  * Implemented `GET /api/v1/insights?month=YYYY-MM`.
  * Created `InsightsController`, `InsightsService`, and `InsightCalculator`.
  * Computes 4 factual observations based on a 3-day activity threshold, 90-day lookback window, partial-month pacing, and a 6-month historical spending trend.
* **Frontend:**
  * Created `/insights` page with `SpendingTrendChart` and `GroupShareChart`.
  * Displays observation cards and friendly empty-state guidance when history is insufficient.

### B. Monthly Reflections (DIV-028 / PR #28)
* **Database (Flyway V6):**
  * Created `reflections` and `reflection_answers` tables with user-scoped isolation.
* **Backend:**
  * Implemented `GET /api/v1/reflections`, `GET /api/v1/reflections/{month}`, `PUT /api/v1/reflections/{month}`, and `DELETE /api/v1/reflections/{month}`.
  * Added optimistic locking and version conflict detection (`ReflectionConflictException`).
* **Frontend:**
  * Created `/reflection` page with prompts, character counters, conflict recovery, and past reflection history.

### C. Profile & Settings (DIV-022, DIV-035 / PR #31)
* **Database (Flyway V7):**
  * Added `display_name`, `onboarding_completed_at`, and `credentials_version` columns to `app_users`.
* **Backend:**
  * `GET /api/v1/profile` and `PATCH /api/v1/profile` (display name updating).
  * `POST /api/v1/profile/password`: Verifies current password; increments `credentials_version` to invalidate concurrent active sessions.
  * `POST /api/v1/profile/delete`: Cascade deletes user account and financial records.
* **Frontend:**
  * Created `/settings` page with modular account forms: display name update, password change, and danger-zone account deletion dialog.

### D. Guided Onboarding (DIV-023 / PR #31)
* **Flow:**
  * A 3-step skippable onboarding stepper for newly registered accounts (`/onboarding`).
  * Captures initial planned income and savings target for the current month without overwriting existing budgets.
  * Marks onboarding as complete via `POST /api/v1/profile/onboarding-complete`.

### E. Password Recovery (DIV-029 / PR #31)
* **Security & Tokens:**
  * Implemented secure token generation: single-use SHA-256 hashed reset token with a 30-minute expiry window.
  * Rate-limited endpoint returning neutral responses to prevent user enumeration attacks.
* **Mailer & Local Dev:**
  * Configured SMTP mailer with Docker Mailpit integration for local testing (`localhost:8025`).
* **Frontend:**
  * Added `/forgot-password` and `/reset-password` routes.

---

## 🎨 2. UI/UX Transformation & Design System

### A. Figma Design System as Primary UI (DIV-041 / PR #25)
* Promoted the dark-theme design across all routes:
  * `/` (Home redirect)
  * `/dashboard`
  * `/budget`
  * `/transactions`
  * `/categories`
  * `/income-sources`
  * `/insights`
  * `/reflection`
  * `/settings`
* Completely eliminated `frontend/features/prototype/FigmaApp.tsx` (over 4,000 lines of prototype mock code deleted).
* Removed legacy components: `AppShell.tsx`, `PrimaryNavigation.tsx`, `TransactionPageShell.tsx`, `QuickAddModal.tsx`.

### B. Recent UI Customizations & Bug Fixes
* **Dashboard Header Action Buttons:**
  * **`+ Add expense`:** Red button (`variant="destructive"` / `--danger`) with matching box shadows and hover transitions.
  * **`+ Add income`:** Green button (`variant="primary"` / `--green`) with white text and icon.
* **Mobile Navigation Dock:**
  * Fixed centering, bottom alignment, and clipping issues on mobile viewports.
* **User Header Avatar:**
  * Removed unnecessary chevron dropdown arrow next to the profile icon.
* **Brand Copy Cleanup:**
  * Purged all user-facing mentions of the "Kakeibo Method" across the site and footer, standardizing on "Personal Budgeting".

---

## 🗄️ 3. Database & Infrastructure

* **Neon PostgreSQL Migrations:**
  * Resolved constraint collision on Neon database: renamed legacy constraint on `monthly_reflections` to avoid collision with `V6__reflections.sql`.
  * Verified Flyway migration sequence through **V7** on Neon PostgreSQL.
* **Local Development Environment:**
  * Added `compose.yaml` with local PostgreSQL 18 container (port `5435`) and Mailpit SMTP/Webmail container (ports `1025`/`8025`).
* **Next.js Dependency Upgrade:**
  * Patched Next.js to `16.4.6` (`PR #30`) to address upstream security advisory.

---

## 🧪 4. Verification & Testing

| Test Suite | Total Tests | Status | Scope |
|---|---|---|---|
| **Frontend TypeScript** | — | **0 errors** (`tsc --noEmit`) | Full frontend application |
| **Frontend Unit & Component** | 152 tests / 13 suites | **152 / 152 PASS** | Auth, Dashboard, Budget, Transactions, Management, Insights, Reflections, Settings |
| **Backend Unit & Testcontainers** | 435 tests | **435 / 435 PASS** | Auth, Rate limiting, Isolation, Migrations, Profile, Password reset, Insights, Reflections |
| **Live Health Check** | Port 8080 & 3000 | **200 OK** | Both Spring Boot backend and Next.js frontend |

---

## 📜 5. Git Commit History (Chronological)

| Commit | Date | Author | Summary |
|---|---|---|---|
| `3a80c20` | 2026-11-16 | Kasun Herath | `test(db): verify migration history without a hardcoded count (DIV-037) (#22)` |
| `2779a5e` | 2026-11-16 | Kasun Herath | `feat(ui): Figma UI as the production UI on the real API (DIV-041) (#25)` |
| `1fa4c86` | 2026-11-16 | Kasun Herath | `docs(governance): record DIV-041 merge and post-merge checks on main (#26)` |
| `ea63fd5` | 2026-11-16 | Kasun Herath | `docs: Phase 03 closeout and DIV-036 production verification (#27)` |
| `ac5033d` | 2026-11-16 | Kasun Herath | `feat: spending insights and monthly reflection (DIV-027, DIV-028) (#28)` |
| `781b44d` | 2026-11-18 | Kasun Herath | `docs: record PR #28 merge and add V6 production runbook (DIV-027, DIV-028) (#29)` |
| `5746118` | 2026-11-18 | Kasun Herath | `feat: profile, onboarding, password reset and account deletion (DIV-022, DIV-023, DIV-029, DIV-035) (#31)` |
| `fba2bc9` | 2026-11-18 | Kasun Herath | `chore(frontend): upgrade next to 16.4.6 (#30)` |
| `cc43466` | 2026-11-18 | Kasun Herath | `docs: record PR #31 and PR #30 merges and post-merge checks (DIV-022, DIV-023, DIV-029, DIV-035) (#32)` |
| `51ddd56` | 2026-11-18 | Kasun Herath | `done` |
| `c8fac22` | 2026-11-19 | Binoj Charuka | `style(dashboard): use red button for expense and green button for income` |

