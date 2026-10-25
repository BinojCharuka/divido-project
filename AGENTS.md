# Divido — AI Agent and Developer Instructions

**Status:** PROPOSED — project owner approval required  
**Applies to:** AI coding agents and human developers working in this repository

## 1. Project structure

- `frontend/` contains the Next.js frontend.
- `backend/` contains the Spring Boot backend.
- `docs/` is the documentation source of truth.
- `docs/README.md` is the entry point for documentation.
- `docs/DOCUMENTATION_INDEX.md` lists documents and their status.
- `docs/TRACEABILITY_MATRIX.md` links requirements to stories, APIs, data, tests, and phases.

Do not assume a file exists just because it appears in a planned documentation tree. Verify the repository before relying on it.

## 2. Required reading before implementation

Before implementing a task:

1. Read this `AGENTS.md`.
2. Read [`docs/README.md`](docs/README.md), [`docs/DOCUMENTATION_RULES.md`](docs/DOCUMENTATION_RULES.md), and [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md).
3. Read the relevant approved product requirement, user story, acceptance criteria, architecture/API contract, and phase plan.
4. Check [`docs/TRACEABILITY_MATRIX.md`](docs/TRACEABILITY_MATRIX.md) for related IDs and dependencies.
5. Confirm that the task is approved and that essential decisions are not still `OPEN` or merely `PROPOSED`.

If an essential requirement or contract is unresolved, ask the project owner or work only on explicitly unblocked tasks. Do not invent product decisions.

## 3. Source of truth and decision status

- Follow the documentation status labels: `PROPOSED`, `OPEN`, `APPROVED`, `FROZEN`, `OUT OF MVP`, and `IMPLEMENTED`.
- A document's existence does not mean it is approved or frozen.
- Do not silently override documented decisions with chat messages, code comments, or assumptions.
- If code, tests, and approved documentation disagree, report the discrepancy and seek clarification.
- Update the relevant documentation, index, and traceability matrix when approved contracts or IDs change.

## 4. Work boundaries

- Keep frontend UI and client-side concerns in `frontend/`.
- Keep business rules, authorization, validation, and persistence enforcement in `backend/`.
- Treat backend validation and authorization as mandatory even when the frontend also validates.
- Coordinate API changes with both frontend and backend developers before implementation.
- Do not add deferred features to the MVP without explicit approval.

## 5. API and integration rules

- Use `docs/05-api/openapi.yaml` and the relevant API documents as the API contract when those documents are approved.
- Do not independently change endpoint paths, HTTP methods, payload fields, response shapes, status codes, or error formats.
- If a contract needs to change, document the reason, affected consumers, compatibility implications, tests, and migration approach, then request approval.
- Use synthetic examples and test data only.
- Never trust a client-supplied user identifier to establish record ownership.

## 6. Database and migrations

- PostgreSQL schema changes must be managed through Flyway migrations.
- Inspect the current repository migrations and `flyway_schema_history` before choosing a migration version.
- Never edit a migration that has already been applied to a shared database; add a new migration instead.
- Verify the live schema before assuming it matches the documentation.
- Do not run destructive SQL against shared or production data without explicit approval and a recovery plan.

## 7. Security and privacy

- Never commit `.env` files, credentials, passwords, session secrets, access tokens, or real personal/financial data.
- Never store plaintext passwords.
- Enforce authorization on the backend for every user-owned record.
- Do not leak another user's record data or existence through API responses or errors.
- Treat session handling, cookie flags, CSRF protection, logout invalidation, and session expiry as a coordinated security design.
- Do not weaken security controls merely to make local development easier; document and isolate any development-only configuration.

## 8. Code quality

- Follow the existing project conventions and dependency versions unless an approved change says otherwise.
- Prefer small, focused changes that solve the assigned task.
- Avoid unrelated refactors and unnecessary dependencies.
- Do not introduce secrets, real user data, or environment-specific paths into source code.
- Handle loading, empty, success, and error states in frontend features where applicable.
- Validate input and return consistent, safe errors in backend features.

## 9. Tests and verification

- Derive tests from acceptance criteria and the documented test strategy.
- Run relevant tests and builds after changes when the environment permits.
- Report exactly which commands were run and whether they passed or failed.
- Never claim a build, test, migration, endpoint, or deployment succeeded unless it was actually verified.
- If a check could not be run, state why and what remains unverified.
- Do not silently skip or delete failing tests.

## 10. Git and collaboration

- Follow `docs/07-development/branching-strategy.md` and `docs/07-development/development-workflow.md` when present and approved.
- Keep commits and pull requests focused.
- Pull requests should reference requirement/story IDs, explain the change, list tests, and disclose known limitations.
- Coordinate shared API, schema, and cross-cutting changes with the other developer.
- Do not overwrite another developer's work or force-push shared branches without explicit agreement.

## 11. Documentation maintenance

- Use Markdown and repository-relative links.
- Mark unresolved decisions as `OPEN`; do not present assumptions as approved facts.
- When a document is missing, report it accurately and update the documentation status/index when appropriate.
- Keep `docs/DOCUMENTATION_INDEX.md` and `docs/TRACEABILITY_MATRIX.md` synchronized with approved additions and changes.
- Keep the implementation aligned with approved acceptance criteria.

## 12. Completion checklist

Before marking a task complete, verify as applicable:

- [ ] The task and acceptance criteria are clear and approved.
- [ ] Frontend/backend responsibilities and API contracts are coordinated.
- [ ] Authorization and validation are enforced server-side.
- [ ] Database changes use a safe, new Flyway migration where needed.
- [ ] Relevant tests were run and results are reported honestly.
- [ ] Documentation and traceability links are updated.
- [ ] No secrets or real personal/financial data were added.
- [ ] Known limitations and follow-up work are recorded.
