# Divido Requirements Documentation

**Status:** Proposed — product owner approval required  
**Set:** 3 — Requirements  
**Depends on:** Set 1 Product, Set 2 UX/UI

## Purpose

This set turns the proposed product scope and UX flows into testable requirements. It is intended for the product owner, frontend developer, backend developer, QA, and AI coding agents.

Requirements are not considered frozen merely because they appear in this package. Review each item marked **TBD**, **Proposed**, or **Owner decision required**. A requirement becomes approved only after the product owner explicitly accepts it and the decision is recorded in `docs/00-governance/decision-log.md` and `docs/00-governance/requirements-freeze.md`.

## Documents

- [Use cases](use-cases.md)
- [User stories](user-stories.md)
- [Acceptance criteria](acceptance-criteria.md)
- [Business rules](business-rules.md)
- [Non-functional requirements](non-functional-requirements.md)

## Requirement ID conventions

- `UC-###`: use case
- `US-###`: user story
- `AC-###`: acceptance criterion
- `BR-###`: business rule
- `NFR-###`: non-functional requirement
- `UX-P##`: UX/UI page reference
- `API-###`: API endpoint reference (defined in Set 5)
- `DB-###`: data/schema reference (defined in Set 6)
- `TC-###`: test case (defined in Set 8)

IDs are stable identifiers. Do not reuse an ID for a different requirement. If a requirement is removed, mark it retired rather than recycling the ID.

## Traceability expectation

Every implemented user story must link to:
1. One or more use cases.
2. Acceptance criteria.
3. Business rules it depends on.
4. UX page/flow, where applicable.
5. API endpoint(s) and data entities, once those sets exist.
6. Unit, integration, UI, and/or security tests as appropriate.
7. A development phase and issue/PR.

If a feature is intentionally deferred, record that in the decision log and future-feature list.
