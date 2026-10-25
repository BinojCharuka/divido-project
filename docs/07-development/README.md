# Set 7 — Development Workflow

**Status:** Proposed working standard — requires project-owner approval  
**Applies to:** Divido frontend, backend, API integration, database changes, and documentation

## Purpose

This set explains how the two developers can build Divido in small, reviewable increments without losing alignment between the Next.js frontend, Spring Boot backend, PostgreSQL schema, API contract, and product requirements.

## Documents in this set

- [Development workflow](development-workflow.md) — end-to-end feature delivery.
- [Frontend roadmap](frontend-roadmap.md) — suggested frontend sequence and boundaries.
- [Backend roadmap](backend-roadmap.md) — suggested backend sequence and boundaries.
- [Integration roadmap](integration-roadmap.md) — how both developers coordinate and test vertical slices.
- [GitHub workflow](github-workflow.md) — issues, commits, pull requests, review, and merge.
- [Branching strategy](branching-strategy.md) — lightweight branch and release model.
- [Pull request template](pull-request-template.md) — required PR information.
- [Issue template](issue-template.md) — feature, bug, and technical-task format.
- [Definition of Done](definition-of-done.md) — quality gate before work is considered complete.

## Related documentation

- [Governance and change control](../00-governance/README.md)
- [Product scope and decisions](../01-product/README.md)
- [Use cases and user stories](../03-requirements/README.md)
- [System architecture](../04-architecture/README.md)
- [API contract](../05-api/README.md)
- [Data and database policy](../06-data/README.md)
- [Testing strategy](../08-testing/README.md)
- [Environment and release operations](../09-release-operations/README.md)
- [Phase plan](../10-phases/README.md)

## Important operating rule

These are proposed plans, not proof that an item has been implemented. Update the documentation when an approved decision or implementation changes. Do not mark product or architecture decisions as frozen until the owner explicitly approves them.

## Suggested first action

Before starting a new feature, both developers should review the relevant requirement, acceptance criteria, API contract, data model, and test expectations together. Then create one issue with a clear owner and split frontend/backend tasks only where parallel work is practical.
