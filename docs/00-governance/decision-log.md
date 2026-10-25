# Decision Log

**Status:** PROPOSED — records discussed decisions, not a final freeze

Use this file to distinguish explicit choices from recommendations and unresolved questions.

| ID | Topic | Current decision or proposal | Status | Notes |
|---|---|---|---|---|
| DEC-001 | Target audience | Individual users | PROPOSED | Shared household collaboration is deferred |
| DEC-002 | Onboarding | Guided onboarding | PROPOSED | Exact fields and screens need UX review |
| DEC-003 | Income sources | Multiple income sources | PROPOSED | Actual income records reference a source |
| DEC-004 | Budget groups | Needs, Wants, Culture, Unexpected | PROPOSED | Confirm category mapping in UX/data set |
| DEC-005 | Money accounts | One overall money view; no account balances | PROPOSED | Not a bank/account aggregation feature |
| DEC-006 | Expense entry | Quick entry; amount and category first | PROPOSED | Optional details should not block save |
| DEC-007 | Payment methods | Manual, optional | PROPOSED | No bank or payment provider integration |
| DEC-008 | Savings | Monthly savings target | PROPOSED | Formula and dashboard presentation need definition |
| DEC-009 | Initial language | English | PROPOSED | Localization can be future work |
| DEC-010 | Shared expenses | Outside MVP | PROPOSED | Future scope |
| DEC-011 | Spending habits | Analyze 90 days; minimum three distinct spending days | PROPOSED | Regularity algorithm still needs definition |
| DEC-012 | Budget allocation | Independent limits; warn if plan exceeds planned income after savings | PROPOSED | Exact warning copy and calculations need definition |
| DEC-013 | Custom categories | Built-in plus user-created categories | PROPOSED | Uniqueness, archive, and historical label rules need design |
| DEC-014 | Transaction deletion | Soft delete with restore | PROPOSED | Retention period unresolved |
| DEC-015 | Authentication | Cookie-based server-side session using maintained framework | PROPOSED | Framework/version and CSRF design need verification |
| DEC-016 | Money lending tracker | Future feature, outside MVP | PROPOSED | Search by username/phone and repayment records later |

## Decision rules

- A `PROPOSED` item is not approved merely because it appears here.
- Record the approver and date when a decision is explicitly approved.
- If a decision is rejected, preserve its history and record the replacement decision.
- Security and database decisions must be reflected in their detailed design documents before implementation.
