# ADR-001 — Modular Monolith for Divido MVP

- **Status:** Proposed
- **Date:** 2026-10-25
- **Decision owner:** Product owner / project owner
- **Related docs:** [System architecture](../system-architecture.md), [Frontend architecture](../frontend-architecture.md), [Backend architecture](../backend-architecture.md), [Security architecture](../security-architecture.md)

## Context

Divido is an MVP personal-finance application with a Next.js frontend, Spring Boot/Java 21 backend, PostgreSQL database, and Flyway migrations. Two developers are collaborating: one primarily on backend and one primarily on frontend. The system needs a clear API boundary and secure user-owned financial data.

## Decision proposed

Use a modular monolith:
- One Next.js frontend application.
- One Spring Boot REST API under `/api/v1`.
- One PostgreSQL database.
- Flyway for schema changes.
- Feature-oriented backend modules with clear controller/service/repository responsibilities.
- Documented JSON API contracts shared by frontend and backend.

## Alternatives considered

### Separate microservices
**Pros:** Independent deployment/scaling and service ownership.  
**Cons:** More infrastructure, distributed failure modes, observability, security boundaries, and coordination than an MVP requires.

### Backend-for-frontend plus separate domain API
**Pros:** Can simplify browser session boundaries in some deployments.  
**Cons:** Adds another application boundary and operational work. Consider only if the chosen deployment/security topology benefits materially.

### Serverless functions per feature
**Pros:** Potentially independent scaling.  
**Cons:** More fragmented transaction/security behavior and deployment complexity for a relational MVP.

## Consequences

### Benefits
- Simpler local development and deployment.
- Clear ownership split between frontend and backend.
- Straightforward relational transactions and reporting.
- Fewer moving parts for two developers.
- API contracts can be tested independently.

### Costs and constraints
- Backend must maintain module boundaries as features grow.
- One backend deployment is a shared release unit.
- API and database changes require coordination and migration discipline.
- Session/CORS/CSRF details still depend on deployment topology.

## Approval conditions

Before marking Accepted:
1. Verify current repository and runtime topology.
2. Confirm product owner agrees with modular monolith.
3. Decide same-origin proxy versus separate origins.
4. Verify Spring Session/CSRF/CORS choices against actual dependencies.
5. Record the approval in the governance decision log and requirements freeze docs.

## Implementation guardrails

- Do not introduce microservices without a new ADR.
- Do not edit applied Flyway migrations.
- Do not expose persistence entities directly as API DTOs.
- Do not rely on frontend authorization.
- Do not use floating-point types for authoritative money calculations.
