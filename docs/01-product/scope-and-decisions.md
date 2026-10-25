# Scope and Decisions

**Status:** PROPOSED  
**Purpose:** Central register of product decisions, assumptions, and open questions.

## Current proposed decisions

| ID | Topic | Proposed decision | Status |
|---|---|---|---|
| DEC-001 | Audience | Individual users | PROPOSED |
| DEC-002 | Onboarding | Guided | PROPOSED |
| DEC-003 | Income | Multiple income sources | PROPOSED |
| DEC-004 | Kakeibo groups | Needs, Wants, Culture, Unexpected | PROPOSED |
| DEC-005 | Accounts | One overall view; no account balances | PROPOSED |
| DEC-006 | Entry UX | Quick expense entry | PROPOSED |
| DEC-007 | Categories | Built-in plus user-created categories | PROPOSED |
| DEC-008 | Payment method | Manual and optional | PROPOSED |
| DEC-009 | Income planning | Planned income and actual income records | PROPOSED |
| DEC-010 | Budget limits | Independent group budgets | PROPOSED |
| DEC-011 | Budget warning | Warn if group allocations plus savings target exceed planned income | PROPOSED |
| DEC-012 | Savings | Monthly savings target | PROPOSED |
| DEC-013 | Habit period | 90 days | PROPOSED |
| DEC-014 | Habit evidence | At least three distinct spending days for a candidate | PROPOSED |
| DEC-015 | Authentication | Cookie-based server-side session using a maintained framework | PROPOSED |
| DEC-016 | Deletion | Soft-delete with restore | PROPOSED |
| DEC-017 | Language | English initially | PROPOSED |
| DEC-018 | Shared expenses | Out of MVP | PROPOSED |
| DEC-019 | Money lending | Future feature, out of MVP | PROPOSED |

## Open product decisions

1. Exact onboarding fields and when monthly planning is required.
2. Exact built-in category names and default Kakeibo group mapping.
3. Whether categories can be moved between groups after they have transactions.
4. Exact calculation and display of planned income, actual income, expenses, net savings, and remaining budget.
5. Whether the user must enter all four group budgets or can leave one at zero/unset.
6. Exact habit matching/regularity algorithm and treatment of category-only patterns.
7. Exact monthly reflection questions.
8. Transaction soft-delete retention period and restore UX.
9. Session expiry and account recovery requirements.
10. Whether custom category names may duplicate system categories.

## Decision policy

- Do not silently resolve an open product decision in code.
- Record recommendations and ask the project owner for approval where the decision affects UX, data, security, or API behaviour.
- Technical details can be selected by the developers only when they do not change product behaviour or frozen contracts; document material choices as ADRs.
