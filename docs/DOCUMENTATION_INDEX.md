# Documentation Index

**Status:** PROPOSED / IN PROGRESS  
**Last reconciled:** 2026-11-02 against repository files.

This index lists every documentation file that exists in the repository, grouped by the numbered folders `00`–`10`, which are the single organization scheme for Divido documentation. The **Declared status** column summarizes each file's own status line, often abbreviated; the source file remains authoritative. It is not an approval record: a document is approved only when the project owner explicitly approves it (see [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md)). Planned files that do not exist are listed separately as `NOT CREATED`.

For authoring and review progress by folder, see [`00-governance/documentation-status.md`](00-governance/documentation-status.md).

## Root and entry-point files

| File | Purpose | Declared status |
|---|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Rules for AI agents and developers | PROPOSED — project owner approval required |
| [`../README.md`](../README.md) | Repository overview and first steps | In development |
| [`README.md`](README.md) | Documentation entry point | In progress — proposed, not frozen |
| [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md) | Status labels, IDs, and change rules | PROPOSED |
| [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md) | This index | PROPOSED / IN PROGRESS |
| [`TRACEABILITY_MATRIX.md`](TRACEABILITY_MATRIX.md) | Requirement-to-implementation links | PROPOSED / UPDATED REGISTER |

## 00 — Governance

| File | Purpose | Declared status |
|---|---|---|
| [`00-governance/README.md`](00-governance/README.md) | Section entry point | PROPOSED |
| [`00-governance/project-principles.md`](00-governance/project-principles.md) | Project-wide principles | PROPOSED |
| [`00-governance/requirements-freeze.md`](00-governance/requirements-freeze.md) | Approval and freeze rules | OPEN — requirements are not frozen |
| [`00-governance/change-control.md`](00-governance/change-control.md) | Change request process | PROPOSED |
| [`00-governance/decision-log.md`](00-governance/decision-log.md) | **Canonical decision register** | PROPOSED — records discussed decisions, not a final freeze |
| [`00-governance/documentation-status.md`](00-governance/documentation-status.md) | Documentation and Phase 00 task status register | IN PROGRESS |
| [`00-governance/progress-tracker.md`](00-governance/progress-tracker.md) | **Master project progress and task backlog tracker** | ACTIVE |

## 01 — Product

| File | Purpose | Declared status |
|---|---|---|
| [`01-product/README.md`](01-product/README.md) | Section entry point | PROPOSED |
| [`01-product/product-overview.md`](01-product/product-overview.md) | Product vision and users | PROPOSED |
| [`01-product/requirements.md`](01-product/requirements.md) | Product requirement register (`REQ-*`, `NFR-*`) | PROPOSED — not frozen |
| [`01-product/mvp-scope.md`](01-product/mvp-scope.md) | Included and excluded MVP scope | PROPOSED — not frozen |
| [`01-product/scope-and-decisions.md`](01-product/scope-and-decisions.md) | Supporting scope and open-decisions summary; the canonical register is `00-governance/decision-log.md` | PROPOSED |
| [`01-product/future-features.md`](01-product/future-features.md) | Deferred features, including `FUT-LEND-001` Money Lending Tracker | PROPOSED — excluded from MVP |
| [`01-product/glossary.md`](01-product/glossary.md) | Shared terminology | PROPOSED |

`scope-and-decisions.md` keeps its historical decision IDs, which overlap with the canonical log but number topics differently. Its table maps each one to the canonical `decision-log.md` entry. Cite `decision-log.md` IDs only.

## 02 — UX/UI

| File | Purpose | Declared status |
|---|---|---|
| [`02-ux-ui/README.md`](02-ux-ui/README.md) | Section entry point | Proposed — owner review required |
| [`02-ux-ui/ux-principles.md`](02-ux-ui/ux-principles.md) | UX principles | Proposed — owner review required |
| [`02-ux-ui/information-architecture.md`](02-ux-ui/information-architecture.md) | Information architecture | Proposed — owner review required |
| [`02-ux-ui/navigation-map.md`](02-ux-ui/navigation-map.md) | Navigation map | Proposed — owner review required |
| [`02-ux-ui/user-flows.md`](02-ux-ui/user-flows.md) | User flows | Proposed — owner review required |
| [`02-ux-ui/wireframes.md`](02-ux-ui/wireframes.md) | Low-fidelity text wireframes | Proposed — not final visual design |
| [`02-ux-ui/pages-and-components.md`](02-ux-ui/pages-and-components.md) | Page and component inventory (`UX-P*`) | Proposed — owner review required |
| [`02-ux-ui/design-system.md`](02-ux-ui/design-system.md) | Design system | Proposed — tokens and branding need owner approval |
| [`02-ux-ui/accessibility.md`](02-ux-ui/accessibility.md) | Accessibility requirements | Proposed — required quality baseline |

## 03 — Requirements

| File | Purpose | Declared status |
|---|---|---|
| [`03-requirements/README.md`](03-requirements/README.md) | Section entry point and ID conventions | Proposed — product owner approval required |
| [`03-requirements/use-cases.md`](03-requirements/use-cases.md) | Use cases (`UC-*`) | Proposed — owner review required |
| [`03-requirements/user-stories.md`](03-requirements/user-stories.md) | User stories (`US-*`) | Proposed — owner review required |
| [`03-requirements/acceptance-criteria.md`](03-requirements/acceptance-criteria.md) | Acceptance criteria (`AC-*`) | Proposed — owner review required |
| [`03-requirements/business-rules.md`](03-requirements/business-rules.md) | Business rules (`BR-*`) | Proposed — owner review required |
| [`03-requirements/non-functional-requirements.md`](03-requirements/non-functional-requirements.md) | Non-functional requirements (`NFR-*`) | Proposed — owner review required |

## 04 — Architecture

| File | Purpose | Declared status |
|---|---|---|
| [`04-architecture/README.md`](04-architecture/README.md) | Section entry point | Proposed — verify against the repository before freezing |
| [`04-architecture/system-architecture.md`](04-architecture/system-architecture.md) | System architecture | Proposed — repository verification and owner approval required |
| [`04-architecture/frontend-architecture.md`](04-architecture/frontend-architecture.md) | Frontend architecture | Proposed |
| [`04-architecture/backend-architecture.md`](04-architecture/backend-architecture.md) | Backend architecture | Proposed |
| [`04-architecture/database-schema.md`](04-architecture/database-schema.md) | Conceptual database schema | Conceptual model — not a migration specification |
| [`04-architecture/security-architecture.md`](04-architecture/security-architecture.md) | Security architecture | Proposed baseline — security review required |
| [`04-architecture/error-handling.md`](04-architecture/error-handling.md) | Error handling | Proposed |
| [`04-architecture/decisions/README.md`](04-architecture/decisions/README.md) | Architecture Decision Record (ADR) rules and register | Active decision register |
| [`04-architecture/decisions/ADR-001-architecture.md`](04-architecture/decisions/ADR-001-architecture.md) | ADR-001: modular monolith | Proposed |

## 05 — API

| File | Purpose | Declared status |
|---|---|---|
| [`05-api/README.md`](05-api/README.md) | Section entry point | Proposed contract |
| [`05-api/api-conventions.md`](05-api/api-conventions.md) | API conventions and error format | Proposed — owner approval required |
| [`05-api/authentication-api.md`](05-api/authentication-api.md) | Authentication API | Proposed contract |
| [`05-api/profile-api.md`](05-api/profile-api.md) | Profile and preferences API | Proposed contract |
| [`05-api/categories-api.md`](05-api/categories-api.md) | Categories API | Proposed contract |
| [`05-api/income-sources-api.md`](05-api/income-sources-api.md) | Income sources API | Proposed contract |
| [`05-api/transactions-api.md`](05-api/transactions-api.md) | Transactions API | Proposed contract |
| [`05-api/budgets-api.md`](05-api/budgets-api.md) | Budgets and monthly plan API | Proposed contract |
| [`05-api/dashboard-api.md`](05-api/dashboard-api.md) | Dashboard API | Proposed contract |
| [`05-api/insights-api.md`](05-api/insights-api.md) | Insights API | Proposed contract — algorithm not yet approved |
| [`05-api/reflections-api.md`](05-api/reflections-api.md) | Monthly reflection API | Proposed contract — MVP inclusion requires approval |
| [`05-api/openapi.yaml`](05-api/openapi.yaml) | OpenAPI specification | `info.version: 1.0.0-proposed` |

## 06 — Data

| File | Purpose | Declared status |
|---|---|---|
| [`06-data/README.md`](06-data/README.md) | Section entry point | Proposed logical design |
| [`06-data/entity-relationships.md`](06-data/entity-relationships.md) | Logical entity relationships | Proposed logical ERD |
| [`06-data/data-dictionary.md`](06-data/data-dictionary.md) | Field catalogue | Proposed field catalogue |
| [`06-data/migration-policy.md`](06-data/migration-policy.md) | Flyway migration policy | Required development rule |
| [`06-data/seed-data.md`](06-data/seed-data.md) | Seed data policy | Proposed — owner approval required |
| [`06-data/data-retention.md`](06-data/data-retention.md) | Data retention and lifecycle | Proposed policy |

## 07 — Development

| File | Purpose | Declared status |
|---|---|---|
| [`07-development/README.md`](07-development/README.md) | Section entry point | Proposed working standard |
| [`07-development/development-workflow.md`](07-development/development-workflow.md) | Feature delivery workflow | Proposed — owner approval required |
| [`07-development/frontend-roadmap.md`](07-development/frontend-roadmap.md) | Frontend roadmap | Proposed sequence |
| [`07-development/phase-02-transaction-ui-plan.md`](07-development/phase-02-transaction-ui-plan.md) | Phase 02 transaction frontend UI/component plan | PROPOSED — planning only; owner/API approval required |
| [`07-development/backend-roadmap.md`](07-development/backend-roadmap.md) | Backend roadmap | Proposed sequence |
| [`07-development/integration-roadmap.md`](07-development/integration-roadmap.md) | Integration roadmap | Proposed |
| [`07-development/github-workflow.md`](07-development/github-workflow.md) | Issues, commits, PRs, review | Proposed — owner approval required |
| [`07-development/branching-strategy.md`](07-development/branching-strategy.md) | Branching model | Proposed — owner approval required |
| [`07-development/pull-request-template.md`](07-development/pull-request-template.md) | PR template content | Not declared |
| [`07-development/issue-template.md`](07-development/issue-template.md) | Issue template content | Not declared |
| [`07-development/definition-of-done.md`](07-development/definition-of-done.md) | Definition of Done | Proposed quality gate |

## 08 — Testing

| File | Purpose | Declared status |
|---|---|---|
| [`08-testing/README.md`](08-testing/README.md) | Section entry point | Proposed test strategy |
| [`08-testing/test-strategy.md`](08-testing/test-strategy.md) | Test strategy | Proposed — owner and developer review required |
| [`08-testing/test-cases.md`](08-testing/test-cases.md) | Cross-feature test cases (`TC-*`) | Proposed test inventory |
| [`08-testing/api-test-cases.md`](08-testing/api-test-cases.md) | API test cases (`API-*`) | Proposed |
| [`08-testing/frontend-test-cases.md`](08-testing/frontend-test-cases.md) | Frontend test cases (`FE-*`) | Proposed |
| [`08-testing/security-test-cases.md`](08-testing/security-test-cases.md) | Security test cases (`SEC-*`) | Proposed security test inventory |
| [`08-testing/regression-checklist.md`](08-testing/regression-checklist.md) | Regression checklist | Proposed checklist |

## 09 — Release and operations

| File | Purpose | Declared status |
|---|---|---|
| [`09-release-operations/README.md`](09-release-operations/README.md) | Section entry point | Proposed operational guidance |
| [`09-release-operations/environment-setup.md`](09-release-operations/environment-setup.md) | Local environment setup | Proposed — verify against the repository |
| [`09-release-operations/deployment-plan.md`](09-release-operations/deployment-plan.md) | Deployment plan | Proposed — hosting not yet frozen |
| [`09-release-operations/configuration-and-secrets.md`](09-release-operations/configuration-and-secrets.md) | Configuration and secrets | Proposed security baseline |
| [`09-release-operations/logging-and-monitoring.md`](09-release-operations/logging-and-monitoring.md) | Logging and monitoring | Proposed operational baseline |
| [`09-release-operations/release-checklist.md`](09-release-operations/release-checklist.md) | Go/no-go checklist | Proposed |

## 10 — Phases

| File | Purpose | Declared status |
|---|---|---|
| [`10-phases/README.md`](10-phases/README.md) | Section entry point | Proposed implementation roadmap |
| [`10-phases/PHASE-00-planning.md`](10-phases/PHASE-00-planning.md) | Phase 00: planning and decisions | Proposed |
| [`10-phases/PHASE-01-foundation-auth.md`](10-phases/PHASE-01-foundation-auth.md) | Phase 01: foundation and authentication | Proposed sequence |
| [`10-phases/PHASE-02-transactions.md`](10-phases/PHASE-02-transactions.md) | Phase 02: transactions | Proposed sequence |
| [`10-phases/PHASE-03-budget-dashboard.md`](10-phases/PHASE-03-budget-dashboard.md) | Phase 03: budgets and dashboard | Proposed sequence |
| [`10-phases/PHASE-04-insights-reflection.md`](10-phases/PHASE-04-insights-reflection.md) | Phase 04: insights and reflection | Conditional proposed phase |
| [`10-phases/PHASE-05-release.md`](10-phases/PHASE-05-release.md) | Phase 05: release readiness | Proposed |

## Planned but not created

These artifacts were listed in earlier versions of this index but do not exist. They are recorded here so nobody assumes they exist.

| Planned path | Status | Notes |
|---|---|---|
| `templates/user-story-template.md` | NOT CREATED | — |
| `templates/use-case-template.md` | NOT CREATED | — |
| `templates/phase-template.md` | NOT CREATED | — |
| `templates/api-endpoint-template.md` | NOT CREATED | — |
| `templates/ADR-template.md` | NOT CREATED | — |
| `11-future/money-lending-tracker.md` | NOT CREATED | Not needed: `FUT-LEND-001` is documented in [`01-product/future-features.md`](01-product/future-features.md). |
