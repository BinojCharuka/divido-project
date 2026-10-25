# Documentation Status Register

**Status:** IN PROGRESS

This register tracks authoring and review status. It must be updated at the end of each documentation set.

| Set | Contents | Status | Exit condition |
|---|---|---|---|
| 1 | Governance and product | IN PROGRESS | Owner reviews product scope and open decisions |
| 2 | UX/UI | NOT STARTED | Pages, flows, wireframes and component inventory reviewed |
| 3 | Requirements | NOT STARTED | Use cases, stories and acceptance criteria traceable |
| 4 | Architecture | NOT STARTED | Frontend/backend/security/database design reviewed |
| 5 | API | NOT STARTED | API contract and OpenAPI agree |
| 6 | Data and testing | NOT STARTED | Data dictionary, migration plan and test cases complete |
| 7 | Development workflow | NOT STARTED | Developer roadmaps and GitHub workflow aligned |
| 8 | Phases, agent rules, release | NOT STARTED | Phase plans and `AGENTS.md` reviewed |
| Final review | Cross-document consistency | NOT STARTED | Traceability and freeze checklist passed |

## Rules

- Do not mark a set complete while its files are missing or its required decisions are still undocumented.
- A set can be authored but awaiting owner review.
- Track `AUTHORED`, `UNDER REVIEW`, `APPROVED`, `FROZEN`, and `NOT STARTED` distinctly when useful.
