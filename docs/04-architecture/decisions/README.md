# Architecture Decision Records

**Status:** Active decision register

An Architecture Decision Record (ADR) captures a significant architecture choice, alternatives, consequences, and approval status.

## ADR rules

- Create an ADR when a decision changes a major technology, system boundary, data model, security model, deployment topology, or team-wide implementation convention.
- Use sequential IDs and never reuse retired IDs.
- Status values: `Proposed`, `Accepted`, `Rejected`, `Superseded`.
- A `Proposed` ADR is not permission to implement an irreversible choice.
- Accepted decisions must be reflected in architecture, API, data, and development docs.
- If a decision changes, create a new ADR or clearly supersede the old one; do not silently rewrite history.

## Current ADRs

- [ADR-001 — Proposed modular-monolith architecture](ADR-001-architecture.md)

## Suggested future ADRs
- Frontend/backend deployment topology and session cookie scope.
- Session persistence mechanism and exact dependency compatibility.
- Transaction data model: one table or separate income/expense tables.
- Default-category ownership and seeding strategy.
- Money precision and API representation.
- Soft-delete and retention policy.
- State/query caching approach in Next.js.
