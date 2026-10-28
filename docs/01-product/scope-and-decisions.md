# Scope and Decisions

**Status:** PROPOSED  
**Purpose:** Supporting summary of product decisions, assumptions, and open questions. This is not a decision register: the canonical register is the [decision log](../00-governance/decision-log.md).

## Current proposed decisions

This table predates the canonical decision log and uses its own numbering. Its IDs are kept for history but are **not canonical**: the same number often refers to a different decision in the log. For example, `DEC-007` here is *Categories*, while canonical `DEC-007` is *Payment methods*. Cite the ID in the **Canonical entry** column. Where wording differs, the decision log is authoritative.

| Historical ID (this file) | Topic | Proposed decision | Status | Canonical entry |
|---|---|---|---|---|
| DEC-001 | Audience | Individual users | PROPOSED | DEC-001 |
| DEC-002 | Onboarding | Guided | PROPOSED | DEC-002 |
| DEC-003 | Income | Multiple income sources | PROPOSED | DEC-003 |
| DEC-004 | Kakeibo groups | Needs, Wants, Culture, Unexpected | PROPOSED | DEC-004 |
| DEC-005 | Accounts | One overall view; no account balances | PROPOSED | DEC-005 |
| DEC-006 | Entry UX | Quick expense entry | PROPOSED | DEC-006 |
| DEC-007 | Categories | Built-in plus user-created categories | PROPOSED | DEC-013 |
| DEC-008 | Payment method | Manual and optional | PROPOSED | DEC-007 |
| DEC-009 | Income planning | Planned income and actual income records | PROPOSED | DEC-020 |
| DEC-010 | Budget limits | Independent group budgets | PROPOSED | DEC-012 |
| DEC-011 | Budget warning | Warn if group allocations plus savings target exceed planned income | PROPOSED | DEC-012 |
| DEC-012 | Savings | Monthly savings target | PROPOSED | DEC-008 |
| DEC-013 | Habit period | 90 days | PROPOSED | DEC-011 |
| DEC-014 | Habit evidence | At least three distinct spending days for a candidate | PROPOSED | DEC-011 |
| DEC-015 | Authentication | Cookie-based server-side session using a maintained framework | PROPOSED | DEC-015 |
| DEC-016 | Deletion | Soft-delete with restore | PROPOSED | DEC-014 |
| DEC-017 | Language | English initially | PROPOSED | DEC-009 |
| DEC-018 | Shared expenses | Out of MVP | PROPOSED | DEC-010 |
| DEC-019 | Money lending | Future feature, out of MVP | PROPOSED | DEC-016 |

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
