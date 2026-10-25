# Set 10 — Phase-by-Phase Implementation Roadmap

**Status:** Proposed implementation roadmap — owner approval required  
**Purpose:** Turn Divido's product and engineering documentation into a sequence the two developers can execute, verify, and track.

## Documents in this set

- [Phase 00 — Planning and decisions](PHASE-00-planning.md)
- [Phase 01 — Foundation and authentication](PHASE-01-foundation-auth.md)
- [Phase 02 — Transactions](PHASE-02-transactions.md)
- [Phase 03 — Budgets and dashboard](PHASE-03-budget-dashboard.md)
- [Phase 04 — Insights and reflection](PHASE-04-insights-reflection.md)
- [Phase 05 — Release readiness](PHASE-05-release.md)

## Related documentation

- [Governance](../00-governance/README.md)
- [Product](../01-product/README.md)
- [UX/UI](../02-ux-ui/README.md)
- [Requirements](../03-requirements/README.md)
- [Architecture](../04-architecture/README.md)
- [API](../05-api/README.md)
- [Data](../06-data/README.md)
- [Development workflow](../07-development/README.md)
- [Testing and QA](../08-testing/README.md)
- [Release operations](../09-release-operations/README.md)
- [Traceability matrix](../TRACEABILITY_MATRIX.md)

## How to use the roadmap

1. Start with Phase 00; do not jump straight to feature coding if key decisions remain unresolved.
2. Treat each phase as a gate. A phase is complete only when its exit criteria have evidence.
3. Create GitHub issues from the phase tasks and link each issue to requirements, APIs, data changes, and tests.
4. The two developers may work in parallel only after contracts and dependencies are agreed.
5. Update the phase status and traceability matrix after each accepted increment.
6. If scope or architecture changes, follow [change control](../00-governance/change-control.md).

## Status values

Use: `Not started`, `In progress`, `Blocked`, `Ready for review`, `Complete`. Keep statuses factual and evidence-based.

## Important boundary

This roadmap is not a promise that all listed features are approved for MVP. Product decisions, security policy, and hosting choices must be explicitly approved. Features marked conditional remain blocked until their scope is confirmed.
