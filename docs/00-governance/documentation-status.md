# Documentation Status Register

**Status:** IN PROGRESS

**Last reconciled:** 2026-10-28 (DIV-004 B1); Phase 02 task status reconciled 2026-11-04 (PR #17)

This register tracks authoring and review status for each numbered documentation folder (`00`–`10`), which are the single organization scheme. For the file-by-file list and each file's declared status, see the [documentation index](../DOCUMENTATION_INDEX.md).

## Documentation folders

| Folder | Contents | Status | Exit condition |
|---|---|---|---|
| `00-governance` | Principles, freeze, change control, decision log, this register | AUTHORED — awaiting owner review | TBD — owner to define |
| `01-product` | Overview, requirements, MVP scope, scope summary, future features, glossary | AUTHORED — awaiting owner review | Owner reviews product scope and open decisions |
| `02-ux-ui` | Principles, IA, navigation, flows, wireframes, pages, design system, accessibility | AUTHORED — awaiting owner review | Pages, flows, wireframes and component inventory reviewed |
| `03-requirements` | Use cases, stories, acceptance criteria, business rules, NFRs | AUTHORED — awaiting owner review | Use cases, stories and acceptance criteria traceable |
| `04-architecture` | System, frontend, backend, database, security, errors, ADRs | AUTHORED — awaiting owner review | Frontend/backend/security/database design reviewed |
| `05-api` | API conventions, per-resource contracts, OpenAPI | AUTHORED — awaiting owner review | API contract and OpenAPI agree |
| `06-data` | ERD, data dictionary, migration policy, seed data, retention | AUTHORED — awaiting owner review | Data dictionary and migration plan complete |
| `07-development` | Workflow, roadmaps, GitHub workflow, branching, templates, DoD | AUTHORED — awaiting owner review | Developer roadmaps and GitHub workflow aligned |
| `08-testing` | Strategy, test cases, regression checklist | AUTHORED — awaiting owner review | Test cases complete |
| `09-release-operations` | Environment, deployment, secrets, monitoring, release checklist | AUTHORED — awaiting owner review | TBD — owner to define |
| `10-phases` | Phase 00–05 plans | AUTHORED — awaiting owner review | Phase plans reviewed |
| Repository root: `AGENTS.md` | Agent and developer rules (not part of `docs/`) | AUTHORED — awaiting owner review | `AGENTS.md` reviewed |
| Final review | Cross-document consistency | NOT STARTED | Traceability and freeze checklist passed |

Exit conditions come from the former set-based register: Set 1 → `00`/`01`; Sets 2–5 → `02`–`05`; Set 6 split into data (`06`) and test cases (`08`); Set 7 → `07`; Set 8 → `10` (phase plans) and root `AGENTS.md`. The former register had no exit condition for release and operations.

No folder is APPROVED or FROZEN. No owner approval of any folder has been recorded.

> **Current task status is kept in [`progress-tracker.md`](progress-tracker.md).** The Phase 00 and Phase 01 tables below are a historical snapshot from 2026-10-28. The tracker records Phase 00 and Phase 01 as complete. The Phase 02 table was reconciled on 2026-11-04.

## Phase 00 task status

Phase 00 ([plan](../10-phases/PHASE-00-planning.md)) is **in progress**. Its exit criteria are not yet met.

| Task | Status | Evidence |
|---|---|---|
| DIV-001 — Repository baseline audit | Complete | Audit report supplied to the project owner (not stored in the repository) |
| DIV-002 — Read-only shared database and Flyway verification | Complete | Verification report supplied to the project owner (not stored in the repository) |
| DIV-003 — Isolated backend Testcontainers test baseline | Implemented and verified; merged into `main` via PR #1 (squash commit `c9d6168`, 2026-10-28) | [PR #1](https://github.com/KasunHerath-dev/divido/pull/1) |
| DIV-004 — Documentation cleanup | In progress: Phase A audit complete; B1 (index, status, links) merged into `main`; B2 (decision register cleanup) under owner review; B3–B5 not started | Phase A report supplied to the project owner; [PR #2](https://github.com/KasunHerath-dev/divido/pull/2) (B1) |

## Phase 01 task status

Phase 01 ([plan](../10-phases/PHASE-01-foundation-auth.md)) is **not complete**, and its entry criteria are not yet recorded as met.

| Task | Status | Evidence |
|---|---|---|
| DIV-005 — Backend registration endpoint | Implemented and merged into `main` via PR #4 (squash commit `5b84174`, 2026-10-28). Not released. | [PR #4](https://github.com/KasunHerath-dev/divido/pull/4); decisions `DEC-021` to `DEC-026` in the [decision log](decision-log.md) |
| DIV-006 — Backend authentication (login, sessions, logout, CSRF) | Implemented with integration tests, including the DIV-006A security-review fixes (header-only masked CSRF tokens, `__Host-` cookies, strict CORS origins); merged into `main` via PR #5 (commit `1f83888`, 2026-10-28). Not released. Session, cookie and CSRF settings (`DEC-027`) were approved by the project owner on 2026-10-28. | [PR #5](https://github.com/KasunHerath-dev/divido/pull/5); [Authentication API](../05-api/authentication-api.md); `DEC-025` and `DEC-027` in the [decision log](decision-log.md) |
| DIV-007 — Frontend authentication (sign-up, sign-in, session detection, sign-out) | Implemented, verified with Vitest component/flow tests and Playwright E2E browser journeys, and merged into `main` via PR #6 (commit `21c9e3c`, 2026-10-28). | [PR #6](https://github.com/KasunHerath-dev/divido/pull/6) |

## Phase 02 task status

Phase 02 ([plan](../10-phases/PHASE-02-transactions.md)) is **complete**: merged via PR #16 (merge commit `0a898a0`) and verified on `main` on 2026-11-04. One test-gate item (month/timezone date policy) is conditional on the DIV-025 decision gate. DIV-022 and DIV-023 are pending owner re-phasing and are not part of the Phase 02 completion record.

| Task | Status | Evidence |
|---|---|---|
| DIV-008A/B/C — Transaction UI foundation, routes & components | Complete; merged into `main` via PR #7 (`e77ee6f`), PR #8 (`68d7b53`), and PR #9 (`3e7a445`). | [PR #7](https://github.com/KasunHerath-dev/divido/pull/7), [PR #8](https://github.com/KasunHerath-dev/divido/pull/8), [PR #9](https://github.com/KasunHerath-dev/divido/pull/9) |
| DIV-009A — Finalize Transaction API contract decisions | Complete; DEC-003, DEC-013, and DEC-014 recorded in canonical decision log. | [decision-log.md](decision-log.md) |
| DIV-010 — Backend Categories & Income Sources foundation | Complete; Flyway V2 migration, categories/income-sources CRUD/deactivate endpoints, 141 tests passing; merged into `main` via PR #10 (`32b5ba2`). | [PR #10](https://github.com/KasunHerath-dev/divido/pull/10) |
| DIV-011 — Transaction database schema migration (`V3`) | Complete; Flyway V3 migration, constraints, indexes, 162 tests passing; merged into `main` via PR #11 (`5a7760f`). | [PR #11](https://github.com/KasunHerath-dev/divido/pull/11) |
| DIV-013 — Backend Transaction CRUD APIs & business logic | Complete; endpoints implemented, hard delete per DEC-014, 176 tests passing; merged into `main` via PR #12 (`2f020c0`). | [PR #12](https://github.com/KasunHerath-dev/divido/pull/12) |
| DIV-014 — Backend Transaction integration & isolation test verification | Complete; 24/24 integration tests and 190/190 full backend suite tests passing; merged into `main` via PR #13 (`4c66c71`). | [PR #13](https://github.com/KasunHerath-dev/divido/pull/13) |
| DIV-018 — Backend MVP completion audit & hardening | Complete; audit report submitted and gap tasks documented. | [progress-tracker.md](progress-tracker.md) |
| DIV-019 — Backend authentication rate limiting | Complete; merged into `main` via PR #14 (merge commit `81dabf6`), 284/284 backend tests reported passing. | [PR #14](https://github.com/KasunHerath-dev/divido/pull/14) |
| DIV-015 — Frontend-Backend Transaction integration & live E2E | Complete; live API integration and 15/15 Playwright journeys; merged into `main` via PR #16 (merge commit `0a898a0`). | [PR #16](https://github.com/KasunHerath-dev/divido/pull/16) |
| DIV-024 — Transaction filter UI completion | Complete; category and income-source filters, Clear filters, page reset, filtered-empty and error states; merged via PR #16. | [PR #16](https://github.com/KasunHerath-dev/divido/pull/16) |
| DIV-020 / DIV-021 — Categories & Income Sources management UI | Complete; `/categories` and `/income-sources` management pages merged via PR #16. | [PR #16](https://github.com/KasunHerath-dev/divido/pull/16) |

## Rules

- Do not mark a folder complete while its files are missing or its required decisions are still undocumented.
- A folder can be authored but awaiting owner review.
- Track `AUTHORED`, `UNDER REVIEW`, `APPROVED`, `FROZEN`, and `NOT STARTED` distinctly when useful.
