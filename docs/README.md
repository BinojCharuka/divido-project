# Divido Documentation

**Status:** In progress — proposed, not frozen  
**Authoring status:** Folders `00`–`10` are authored and awaiting owner review; see the [documentation status register](00-governance/documentation-status.md).

## Purpose

This directory is the single source of truth for approved Divido product requirements, UX decisions, architecture, API contracts, database design, tests, and delivery workflow.

## Read this first

1. [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md)
2. [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)
3. [`00-governance/project-principles.md`](00-governance/project-principles.md)
4. [`00-governance/requirements-freeze.md`](00-governance/requirements-freeze.md)
5. [`01-product/product-overview.md`](01-product/product-overview.md)
6. [`01-product/mvp-scope.md`](01-product/mvp-scope.md)
7. The relevant phase plan and user story before implementation.

## Status labels

- **PROPOSED** — suggested but not approved.
- **APPROVED** — explicitly reviewed and accepted by the project owner.
- **FROZEN** — approved baseline; changes require change control.
- **OPEN** — decision is unresolved.
- **OUT OF MVP** — intentionally deferred.
- **IMPLEMENTED** — implemented and verified; not a product approval status.

Never treat a document as frozen merely because it exists in the repository.

## Documentation folders

The numbered folders are the single organization scheme. Where a document refers to "Set N", it means the folder numbered N (for example, Set 5 is `05-api/` and Set 10 is `10-phases/`).

- [`00-governance/`](00-governance/README.md): principles, freeze rules, change control, the canonical decision log, and status register.
- [`01-product/`](01-product/README.md): product overview, requirements, MVP scope, scope summary, future features, and glossary.
- [`02-ux-ui/`](02-ux-ui/README.md): UX principles, navigation, flows, wireframes, pages, design system, and accessibility.
- [`03-requirements/`](03-requirements/README.md): use cases, user stories, acceptance criteria, business rules, and non-functional requirements.
- [`04-architecture/`](04-architecture/README.md): system, frontend, backend, database, security, error handling, and ADRs.
- [`05-api/`](05-api/README.md): API conventions, per-resource contracts, and OpenAPI.
- [`06-data/`](06-data/README.md): entity relationships, data dictionary, migration policy, seed data, and retention.
- [`07-development/`](07-development/README.md): development workflow, roadmaps, GitHub workflow, branching, templates, and Definition of Done.
- [`08-testing/`](08-testing/README.md): test strategy, test cases, and regression checklist.
- [`09-release-operations/`](09-release-operations/README.md): environment setup, deployment, configuration and secrets, monitoring, and release checklist.
- [`10-phases/`](10-phases/README.md): Phase 00–05 implementation plans.

The full file list is in [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md).

## Current project status

The project has an existing Next.js frontend folder, Spring Boot backend, Java 21, PostgreSQL on Neon, Flyway, and a health endpoint according to project notes. Verify actual repository files and live schema before relying on these notes. Existing applied Flyway migrations must not be rewritten.
