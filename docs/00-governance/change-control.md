# Change Control

**Status:** PROPOSED

## When to raise a change request

Raise a change request when a proposed change affects approved or frozen:
- Product scope, requirements, or acceptance criteria.
- UX flow, page behaviour, or design contract.
- API paths, payloads, validation, errors, or authentication.
- Database schema, data ownership, constraints, or migrations.
- Security, privacy, data retention, or deployment configuration.
- Phase scope, dependencies, or release criteria.

Routine internal refactoring that preserves observable behaviour and contracts does not require a product change request, but it must pass code review and tests.

## Change request template

- ID: `CR-YYYY-NNN`
- Title:
- Requester:
- Date:
- Status: `PROPOSED | APPROVED | REJECTED | DEFERRED`
- Reason and user impact:
- Current behaviour:
- Proposed behaviour:
- Requirements/stories affected:
- UI documents affected:
- API contracts affected:
- Database/migration impact:
- Security/privacy impact:
- Tests to add/update:
- Roadmap and release impact:
- Backward compatibility and rollback plan:
- Decision and approver:

## Workflow

1. Record the change request.
2. Identify all affected traceability IDs and files.
3. Estimate frontend, backend, database, testing, and release impact.
4. Review compatibility and data migration risks.
5. Obtain approval from the project owner.
6. Update documents and traceability before or alongside implementation.
7. Implement in a dedicated branch and verify tests.
8. Record the merge/implementation reference and close the request.
