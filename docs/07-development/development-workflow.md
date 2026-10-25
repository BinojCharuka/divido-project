# Development Workflow

**Status:** Proposed — owner approval required  
**Goal:** Deliver Divido as small, testable, integrated slices rather than as separate frontend and backend projects.

## 1. Working principles

1. **Requirements before implementation.** Every user-visible feature must trace to an approved or explicitly provisional user story and acceptance criteria.
2. **Contract before parallel coding.** Agree on request/response shapes, validation, errors, ownership rules, and database effects before frontend and backend work diverge.
3. **Vertical slices first.** Prefer a complete small path (for example, create and list a transaction) over building every screen first or every backend endpoint first.
4. **One source of truth.** API details live in `docs/05-api/openapi.yaml` and related endpoint documents; database evolution follows `docs/06-data/migration-policy.md`.
5. **Small changes are easier to review.** Keep pull requests focused, with clear test evidence and no unrelated formatting or refactoring.
6. **Never commit secrets.** Use local environment files excluded by `.gitignore`; follow [configuration and secrets](../09-release-operations/configuration-and-secrets.md).
7. **Do not rewrite applied migrations.** Add a new Flyway migration for changes to an already-applied schema.
8. **Do not silently change scope.** Record unresolved choices and get owner approval before turning assumptions into permanent product behavior.

## 2. Roles for the current two-developer setup

The following split is a starting point and may be changed by mutual agreement.

| Responsibility | Backend developer | Frontend developer | Shared |
|---|---|---|---|
| Spring Boot services, validation, authorization | Lead | Consult | Review contract and behavior |
| Next.js screens, components, client state | Consult | Lead | Review user flow and accessibility |
| API request/response contract | Lead for server feasibility | Lead for UI needs | Agree before implementation |
| Database model and Flyway migrations | Lead | Consult on UI needs | Review data lifecycle |
| API integration and end-to-end checks | Lead server-side | Lead browser-side | Both verify a complete user journey |
| Product decisions and scope | Propose | Propose | Owner decides; document decision |
| PR review | Review frontend-related API use | Review backend contract compatibility | Both review cross-cutting changes |

A person may author and review different parts, but should not be the only person to verify a cross-stack feature.

## 3. Standard feature workflow

### Step A — Select and clarify

- Pick one small user story from the approved roadmap.
- Confirm its user value, scope, dependencies, and acceptance criteria.
- Identify questions that block implementation; do not bury them in code comments.
- Add or update the traceability links in the requirements and API documentation.

### Step B — Define the contract

For any API-backed feature, agree on:

- Endpoint and HTTP method.
- Authentication and ownership requirements.
- Request schema, required fields, bounds, and formats.
- Success response and status code.
- Validation and error response behavior.
- Pagination, sorting, and date/time rules where applicable.
- Database changes, indexes, uniqueness rules, and soft-delete behavior.
- Loading, empty, success, and failure states in the UI.
- Unit, integration, and acceptance tests.

Update the endpoint document and `openapi.yaml` before or alongside implementation. The contract is proposed until the team and owner accept it.

### Step C — Create the issue and tasks

- Create one parent issue for the user-visible outcome.
- Add frontend/backend/database subtasks only if they have distinct deliverables.
- Include links to the user story, use case, acceptance criteria, API endpoint, and relevant phase.
- Name one accountable owner per issue. Other contributors can be reviewers or collaborators.
- Label dependencies and identify the order in which tasks can merge.

### Step D — Implement in a short-lived branch

- Create a branch using [the branching strategy](branching-strategy.md).
- Implement the smallest coherent part.
- Add or update tests with the behavior, not as a separate afterthought.
- Update docs when the contract or decisions change.
- Run relevant local checks before opening a PR.

### Step E — Review and merge

- Open a PR using [the PR template](pull-request-template.md).
- Link the issue and explain observable behavior.
- Include tests run and any manual verification.
- Resolve review comments or document why a suggestion is not adopted.
- Do not merge with failing required checks, unresolved security concerns, or a broken API contract.
- Prefer squash merge if the repository settings and team agree; use one consistent strategy.

### Step F — Integrate and verify

- Pull the merged branch into the integration environment.
- Verify the frontend against the actual backend, not only mocked responses.
- Test the full user journey, authorization boundaries, and error states.
- Update the phase checklist and traceability matrix.
- Close the issue only when the Definition of Done is met.

## 4. API-first coordination pattern

For parallel work, use this order:

1. Jointly agree on the API shape and behavior.
2. Backend publishes a sample response or a working endpoint; frontend may use a clearly marked mock until then.
3. Frontend implements against the agreed contract, not against assumptions from a screenshot.
4. Backend implements validation, persistence, and authorization.
5. Both test contract compatibility.
6. Remove temporary mocks from production paths and test the real integrated flow.
7. Update OpenAPI and endpoint docs if implementation required an approved change.

Mocks must be conspicuously identified and must not be treated as proof of backend completion.

## 5. Daily collaboration

A lightweight daily check-in can cover:

- What issue was completed or advanced?
- What is the next deliverable?
- What is blocked, and who can resolve it?
- Did an API, schema, or requirement change?
- Is a merge or environment change likely to affect the other developer?

Use GitHub issues and PRs as the durable record; do not rely on chat messages alone for important decisions.

## 6. Database change workflow

1. Describe the intended schema change in the issue.
2. Update the data dictionary / ERD documentation.
3. Add a new ordered Flyway migration.
4. Test migration from an empty local database where practical and from the current schema version.
5. Test constraints and rollback/recovery expectations (Flyway migrations are generally forward-only; prefer a corrective migration rather than editing history).
6. Confirm that application code and migrations are compatible in the same PR or coordinated PRs.
7. Never place production credentials or real personal finance data in fixtures or test logs.

## 7. When a requirement changes

- Stop and identify affected user stories, API operations, UI screens, schema, tests, and roadmap items.
- Record the proposed decision in `docs/00-governance/decision-log.md` or the relevant ADR.
- Obtain owner approval for product-scope or material security/data changes.
- Update all affected docs and contracts in the same change set where practical.
- Add a migration for deployed schema changes; never edit an applied migration.
- Include migration and compatibility notes in the PR.

## 8. Suggested issue states

`Backlog → Ready → In Progress → In Review → Integrated → Done`

- **Backlog:** not sufficiently clarified or prioritized.
- **Ready:** scope and acceptance criteria are clear enough to start.
- **In Progress:** actively being implemented.
- **In Review:** PR opened; review or CI is pending.
- **Integrated:** merged and verified against the integrated app, but phase-level validation may remain.
- **Done:** Definition of Done satisfied and documentation/traceability updated.

If GitHub project statuses are unavailable, use labels or a simple project board. Keep state names consistent.

## 9. Release safety

- Keep incomplete features behind a disabled route/feature flag where feasible; otherwise avoid merging partial user-facing behavior into the release branch.
- Test migrations and environment configuration before deploying.
- Verify health checks, logs, and critical journeys after deployment.
- Have a documented recovery plan; do not assume a database rollback is safe.
- See [release checklist](../09-release-operations/release-checklist.md).

## 10. Completion evidence

Every completed feature should leave evidence in the repository:

- Issue and acceptance criteria.
- PR with reviewer approval.
- Relevant automated test results.
- Integrated verification result.
- Updated API/data/product docs as needed.
- Updated phase progress and traceability status.
