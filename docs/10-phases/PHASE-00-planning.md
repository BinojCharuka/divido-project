# Phase 00 — Planning and Decisions

**Status:** Proposed — required before feature scope is frozen  
**Primary outcome:** The team agrees what to build, how it should behave, and how it will be tested before implementing dependent features.

## Goal

Resolve the highest-impact open questions and make the repository, API contracts, database model, UX flows, and development process consistent. Avoid coding assumptions that create expensive rework.

## Entry criteria

- Documentation Sets 1–9 are available in the repository or their relevant contents are linked.
- Current frontend and backend repositories have been inspected.
- Existing database schema and Flyway history are understood.
- Project owner and both developers can review unresolved decisions.

## Tasks

### Product and UX
- [ ] Review MVP scope and future-feature boundary.
- [ ] Confirm onboarding fields and which are required.
- [ ] Confirm login identifier, registration policy, and account recovery expectations.
- [ ] Approve built-in category list, Kakeibo group mapping, and custom-category behavior.
- [ ] Confirm whether income sources are managed separately and what income transaction fields are required.
- [ ] Approve transaction fields, payment-method optionality, edit/delete/restore behavior, and date semantics.
- [ ] Confirm monthly budget model, planned-vs-actual definitions, savings target, and allocation warning rule.
- [ ] Approve dashboard calculations and month navigation behavior.
- [ ] Decide whether reflections are in MVP, including editability and retention.
- [ ] Decide whether spending-habit insights are in MVP and approve their minimum-data and explanation rules.
- [ ] Confirm language, currency, timezone, and localization assumptions.
- [ ] Confirm responsive/accessibility expectations and critical user journeys.

### Architecture and API
- [ ] Review the proposed architecture against the actual codebase.
- [ ] Approve or amend the session/authentication architecture.
- [ ] Confirm API error envelope, status codes, pagination/filtering conventions, and OpenAPI ownership.
- [ ] Review every MVP endpoint and mark contract status: Draft / Reviewed / Approved / Implemented / Tested.
- [ ] Confirm how frontend calls backend in local, staging, and production environments.
- [ ] Confirm CORS, cookie, CSRF, and session expiry policies.

### Data and security
- [ ] Compare proposed data model with the current PostgreSQL schema.
- [ ] Inspect Flyway history; preserve already-applied migrations.
- [ ] Approve money precision and serialization rules.
- [ ] Approve user ownership enforcement, soft-delete semantics, and data-retention rules.
- [ ] Define backup/restore expectations before production use.
- [ ] Confirm secret storage and rotation process.

### Delivery readiness
- [ ] Verify actual scripts, dependency versions, test commands, and CI status.
- [ ] Agree branch, PR review, and merge strategy.
- [ ] Create GitHub issue labels/templates and phase board if useful.
- [ ] Identify deployment provider and required environments, or explicitly defer production deployment decisions.
- [ ] Assign accountable owners and priority to the first implementation issues.

## Deliverables

- Approved MVP scope and open-decision register.
- Reviewed user stories and acceptance criteria.
- API/OpenAPI contract approved for the first vertical slice.
- Data model reconciled with the current schema.
- Documented local setup and actual test commands.
- Prioritized issue backlog for Phase 01 onward.

## Exit criteria

- [ ] No unresolved question blocks the first implementation slice.
- [ ] Required product and security decisions have an owner and explicit status.
- [ ] No proposed decision is labeled frozen without owner approval.
- [ ] Current schema and applied migrations are documented.
- [ ] The first feature has a complete story → acceptance criteria → API → data → tests chain.

## Do not proceed if

- Login/session design is still ambiguous while authentication code is being finalized.
- The proposed schema conflicts with existing tables and no migration plan exists.
- Frontend and backend developers have different assumptions about an endpoint.
- A security-sensitive decision is being silently made by implementation convenience.

## Suggested first vertical slice

Choose the smallest agreed authentication/profile journey. Define the exact endpoint, cookie/CSRF behavior, validation errors, and database effect before both developers implement their parts.
