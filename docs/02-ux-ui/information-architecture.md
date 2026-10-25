# Information Architecture

**Status:** Proposed — owner review required

## 1. MVP navigation model

Proposed primary destinations:

1. **Dashboard** — current-month overview and quick actions.
2. **Transactions** — list, search/filter, add, edit, and soft-delete income/expenses.
3. **Budget** — monthly income plan, savings target, and four group budgets.
4. **Insights** — spending patterns based on available history.
5. **Reflection** — monthly review and answers, if the reflection feature is approved for MVP.
6. **Settings** — profile, preferences, categories, income sources, and session/account actions.

The exact top-level navigation presentation (bottom navigation on mobile versus sidebar/top navigation on desktop) is proposed in [Navigation map](navigation-map.md).

## 2. Sitemap

```text
App
├── Public / Session
│   ├── Sign in
│   ├── Create account
│   ├── Recover access (TBD: recovery method)
│   └── Onboarding
│       ├── Profile and preferences
│       ├── Income sources and planned income
│       ├── Savings target
│       ├── Group budgets
│       └── Review setup
└── Authenticated
    ├── Dashboard
    ├── Transactions
    │   ├── Transaction list
    │   ├── Add expense
    │   ├── Add income
    │   └── Edit transaction
    ├── Budget
    │   ├── Monthly plan
    │   └── Edit monthly plan
    ├── Insights
    │   └── Spending habit detail (if needed)
    ├── Reflection
    │   ├── Current month
    │   └── Past reflection (if retained)
    └── Settings
        ├── Profile and preferences
        ├── Categories
        ├── Income sources
        ├── Payment methods (manual options, if enabled)
        ├── Session / sign out
        └── Data/account controls (details TBD)
```

## 3. Main entities visible to users

- **Income source:** a label describing where income comes from; it is not a bank account.
- **Income entry:** money received and recorded for a date.
- **Expense entry:** money spent and recorded for a date.
- **Category:** a user-selectable label mapped to one of the four Kakeibo groups.
- **Monthly plan:** planned income, savings target, and planned allocations.
- **Group budget:** planned amount for Needs, Wants, Culture, or Unexpected.
- **Insight:** a pattern derived from recorded history and its stated lookback window.
- **Reflection:** a user's optional answers about the month.

## 4. Key distinctions in UI

| Concept | Meaning | UI must not imply |
|---|---|---|
| Planned income | Amount expected during a selected month | Money has already arrived |
| Recorded income | Income entries actually recorded | It is necessarily the bank balance |
| Savings target | Amount the user intends to save | Money has been transferred or reserved |
| Group budget | Planned allocation for a Kakeibo group | A separate bank account exists |
| Budget remaining | Budget amount minus eligible recorded spending | The user has that amount in a bank account |
| Income source | A source label for income records/planning | A linked bank or payment provider |
| Payment method | Optional manual label on an entry | A verified payment integration |

## 5. Access and entry points

- Unauthenticated users see sign-in/create-account routes.
- A successful first sign-in routes to onboarding until required setup is complete.
- Returning users land on Dashboard.
- “Add expense” and “Add income” should be reachable from Dashboard and Transactions.
- Editing a transaction should preserve its originating context when practical.
- Empty-state calls to action should link directly to the relevant create flow.
- If a route is opened directly without a valid session, send the user to sign-in and preserve a safe local return path.

## 6. TBD items

- Whether Reflection is included in the initial MVP release.
- Exact onboarding required fields and whether setup can be skipped.
- Whether users can browse previous months from Dashboard, Budget, and Reflection.
- Whether Insights has its own detail page or only dashboard cards.
- Final route naming and URL conventions.
