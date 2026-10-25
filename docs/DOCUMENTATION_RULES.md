# Documentation Rules

**Status:** PROPOSED  
**Owner:** Divido project owner  
**Applies to:** Human developers and AI coding agents

## 1. Single source of truth

- Requirements, UX behaviour, API contracts, schema, security, and test expectations must be documented here.
- Chat discussions and code comments do not silently override approved documentation.
- If code and an approved contract disagree, stop and raise a discrepancy instead of guessing.

## 2. Status labels

Every decision or specification must clearly distinguish:
- `PROPOSED`: recommendation awaiting approval.
- `OPEN`: unresolved question or dependency.
- `APPROVED`: explicitly accepted by the project owner.
- `FROZEN`: approved baseline controlled by change requests.
- `OUT OF MVP`: excluded from the MVP.
- `IMPLEMENTED`: code exists and has been verified against tests.

`IMPLEMENTED` does not mean the feature's requirements are frozen.

## 3. Traceability IDs

Use stable IDs and do not reuse retired IDs:
- Requirements: `REQ-...`
- Use cases: `UC-...`
- User stories: `US-...`
- UI screens/components: `UI-...`
- API operations: `API-...`
- Database entities/decisions: `DB-...`
- Test cases: `TEST-...`
- Phases: `PHASE-...`
- Architecture decisions: `ADR-...`
- Change requests: `CR-...`

Each story must link to its requirement, use case, acceptance criteria, UI, API, database impact, tests, and phase where relevant.

## 4. Implementation gate

Before coding a story, the assigned developer must:
1. Read the root `AGENTS.md` when present.
2. Read `docs/README.md` and `docs/DOCUMENTATION_INDEX.md`.
3. Read the phase plan and story's linked documents.
4. Confirm the story is approved for implementation.
5. Identify dependencies and blockers.
6. Confirm the API contract and UI behaviour are agreed by both frontend and backend developers.

If any essential contract is `OPEN`, ask for clarification or work only on explicitly unblocked tasks.

## 5. Changes to contracts

Do not silently change:
- Product scope or acceptance criteria.
- API path, method, payload, status codes, or error format.
- Database ownership, constraints, or migration history.
- Authentication, password handling, session, or CSRF behaviour.
- UI behaviour relied on by another story.

Raise a change request with reason, affected IDs/files, compatibility impact, migration plan, tests, and rollback approach. Obtain approval before changing frozen requirements.

## 6. Database rules

- Flyway owns schema changes.
- Never edit a migration already applied to a shared database.
- Add a new migration for subsequent changes.
- Inspect the current schema and `flyway_schema_history` before choosing migration versions.
- Never run destructive SQL against shared/production data without explicit approval and a recovery plan.

## 7. Security rules

- Never store plaintext passwords.
- Never commit `.env`, credentials, session secrets, access tokens, or real personal/financial data.
- Never trust a `userId` supplied by the client to determine record ownership.
- Authorize access to every user-owned record on the backend.
- Do not expose another user's record existence or data through errors.
- Treat cookie authentication, CSRF, session expiry, logout invalidation, and secure cookie settings as a complete design.

## 8. Testing and reporting

- Implement tests from acceptance criteria.
- Report exact tests run and their outcome.
- Do not claim a build, test, migration, or endpoint succeeded unless it was actually run and verified.
- Do not skip failing tests without documenting the reason and approval.
- A pull request must include story IDs, summary, tests, screenshots/API examples when useful, and known limitations.

## 9. Documentation quality

- Use Markdown and relative links within the repository.
- Keep examples synthetic; do not include real passwords, phone numbers, or personal finance records.
- Update the documentation index and traceability matrix when new documents or IDs are added.
- If a file is not yet authored, mark it `NOT CREATED` in the status register instead of implying it exists.
