# Divido Documentation

**Status:** In progress — proposed, not frozen  
**Current documentation set:** Set 1 — Governance and Product

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

## Documentation sets

- Set 1: Governance and product definition.
- Set 2: UX/UI and wireframes.
- Set 3: Use cases, user stories, acceptance criteria, and business rules.
- Set 4: Architecture, security, database design, and class responsibilities.
- Set 5: API contracts and OpenAPI.
- Set 6: Data dictionary, test strategy, test cases, and traceability.
- Set 7: Development workflow and frontend/backend roadmaps.
- Set 8: Phase execution plans, AI agent rules, release and operations.

## Current project status

The project has an existing Next.js frontend folder, Spring Boot backend, Java 21, PostgreSQL on Neon, Flyway, and a health endpoint according to project notes. Verify actual repository files and live schema before relying on these notes. Existing applied Flyway migrations must not be rewritten.
