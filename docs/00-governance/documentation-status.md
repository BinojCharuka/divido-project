# Documentation Status Register

**Status:** IN PROGRESS

**Last reconciled:** 2026-10-28 (DIV-004 B1)

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
| DIV-007 — Frontend authentication (sign-up, sign-in, session detection, sign-out) | Implemented on branch `feature/div-007-frontend-auth`; pending owner review in a pull request. Not merged or released. `/sign-up`, `/sign-in` and a placeholder signed-in `/onboarding` page, with component and flow tests (Vitest) and browser journeys (Playwright) run against a local backend and a disposable database. Onboarding content is not specified yet. | [Frontend README](../../frontend/README.md); [Authentication API](../05-api/authentication-api.md) |

## Rules

- Do not mark a folder complete while its files are missing or its required decisions are still undocumented.
- A folder can be authored but awaiting owner review.
- Track `AUTHORED`, `UNDER REVIEW`, `APPROVED`, `FROZEN`, and `NOT STARTED` distinctly when useful.
