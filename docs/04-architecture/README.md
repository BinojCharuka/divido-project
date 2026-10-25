# Divido Architecture Documentation

**Status:** Proposed architecture — verify against the current repository and approve before treating as frozen.  
**Set:** 4 — Architecture  
**Depends on:** Set 1 Product, Set 2 UX/UI, Set 3 Requirements.

## Purpose

Define system boundaries, frontend/backend responsibilities, data flow, security boundaries, error behavior, and architecture decisions so the two developers can implement compatible parts independently.

## Documents
- [System architecture](system-architecture.md)
- [Frontend architecture](frontend-architecture.md)
- [Backend architecture](backend-architecture.md)
- [Database schema overview](database-schema.md)
- [Security architecture](security-architecture.md)
- [Error handling](error-handling.md)
- [Architecture decisions](decisions/README.md)
- [ADR-001: Proposed architecture](decisions/ADR-001-architecture.md)

## Known repository context

From prior project discussion:
- Repository root is `divido/`.
- Frontend uses Next.js.
- Backend uses Spring Boot, Maven, and Java 21.
- PostgreSQL is hosted on Neon.
- Flyway manages database migrations.
- A `V1__init.sql` migration has already been applied.
- `GET /api/v1/health` works and the health route is permitted by Spring Security.
- `.env` is sourced locally for environment variables; Spring Boot does not automatically load a shell `.env` file in every setup.

Verify these details against the live repository before changing configuration. Do not edit an applied Flyway migration; add a new migration.

## Architecture status rule

This set proposes a modular monolith: one Spring Boot API and one Next.js application, with PostgreSQL as the primary data store. Do not introduce microservices, queues, bank integrations, or additional infrastructure without an approved ADR.

Any technology version, framework capability, dependency compatibility, or security setting must be checked against the actual `pom.xml`, package manifest, and deployed environment before implementation.
