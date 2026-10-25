# Product Requirements

**Status:** PROPOSED — not frozen  
**Version:** 0.1

This document is the product-level requirement register. Detailed use cases and acceptance criteria will be authored in Set 3 and linked by stable IDs.

## Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| REQ-AUTH-001 | A user can register, sign in, and sign out. | Must | PROPOSED |
| REQ-AUTH-002 | An authenticated user can access only their own personal finance data. | Must | PROPOSED |
| REQ-PROF-001 | A user can view and update profile preferences. | Must | PROPOSED |
| REQ-ONB-001 | A new user can complete guided onboarding. | Must | PROPOSED |
| REQ-CAT-001 | The app provides built-in expense categories mapped to four Kakeibo groups. | Must | PROPOSED |
| REQ-CAT-002 | A user can create, rename, and archive their own custom categories. | Must | PROPOSED |
| REQ-INC-001 | A user can create and manage multiple income sources. | Must | PROPOSED |
| REQ-TRX-001 | A user can add an expense with amount and category as the required fields. | Must | PROPOSED |
| REQ-TRX-002 | A user can record actual income against an income source. | Must | PROPOSED |
| REQ-TRX-003 | A user can list, filter, and inspect their transactions. | Must | PROPOSED |
| REQ-TRX-004 | A user can edit an active transaction. | Must | PROPOSED |
| REQ-TRX-005 | A user can soft-delete and restore their own transactions. | Must | PROPOSED |
| REQ-BUD-001 | A user can set planned monthly income and a savings target. | Must | PROPOSED |
| REQ-BUD-002 | A user can set independent budgets for Needs, Wants, Culture, and Unexpected. | Must | PROPOSED |
| REQ-DASH-001 | A user can view monthly planned/actual income, expenses, and budget progress. | Must | PROPOSED |
| REQ-INS-001 | A user can view spending patterns based on up to 90 days of recorded transactions. | Must | PROPOSED |
| REQ-REF-001 | A user can save a monthly reflection. | Must | PROPOSED |
| REQ-SET-001 | A user can manage profile and category preferences. | Must | PROPOSED |

## Non-functional requirements (initial)

| ID | Requirement | Status |
|---|---|---|
| NFR-SEC-001 | Passwords are stored only as adaptive hashes using a maintained security library. | PROPOSED |
| NFR-SEC-002 | Every user-owned resource is authorized server-side. | PROPOSED |
| NFR-SEC-003 | Cookie sessions use secure settings and appropriate CSRF protection. | PROPOSED |
| NFR-DATA-001 | Monetary values use exact decimal types, not binary floating point. | PROPOSED |
| NFR-DATA-002 | Flyway manages schema changes; applied shared migrations are immutable. | PROPOSED |
| NFR-UX-001 | Quick expense entry is mobile-friendly and optional fields do not block saving. | PROPOSED |
| NFR-ERR-001 | API errors use a consistent documented format. | PROPOSED |
| NFR-TEST-001 | Each approved story has testable acceptance criteria and corresponding tests. | PROPOSED |
| NFR-PRIV-001 | No real credentials or personal financial records are committed to the repository. | PROPOSED |

## Open details

The exact onboarding fields, category list, dashboard calculations, habit-detection algorithm, reflection questions, session framework configuration, and detailed validation/error contracts remain open until their respective documentation sets are completed.

Do not use this document alone as authorization to implement an endpoint. Use the approved story, API contract, and phase plan.
