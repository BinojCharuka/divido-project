# Phase 02 Frontend Transaction UI Plan

**Status:** PROPOSED — planning only; owner approval and API-contract agreement required before implementation

**Scope:** UI planning for recording income and expenses, viewing transaction history, and editing or deleting a transaction. This plan does not add frontend API calls, routes, data mocks in production code, or backend changes.

## 1. Review findings and boundaries

### Current frontend baseline

- The frontend is a TypeScript Next.js 16 App Router application using React 19 and Tailwind CSS 4.
- The existing source layout is already suitable for incremental growth: `app/` for routes, `components/` for shared UI, `features/` for feature behavior, and `lib/` for shared services.
- The only implemented signed-in destination is the protected onboarding placeholder. Sign-in currently redirects there through `SIGNED_IN_HOME`.
- Authentication is implemented with an in-memory client-side session state, cookie-backed server session, and a shared API client. The client sends `credentials: "include"`, obtains a masked CSRF token before writes, retries one invalid-CSRF response, and normalizes API errors.
- Sign-out and session expiry intentionally use a full page load so a prior user's cached signed-in route state is removed. Transaction work must preserve this behavior.
- Existing shared UI is intentionally small: `AuthPageShell`, `TextField`, `FormAlert`, `SessionGate`, and the auth feature components. Styling is currently authentication-focused and uses literal Tailwind colour classes; the proposed design tokens have not yet been approved.

### Contract and approval boundary

`transactions-api.md`, `categories-api.md`, the Phase 02 plan, UX pages/components, and the design system are all **PROPOSED**. No transaction endpoint, entity, migration, controller, or frontend transaction client exists in the checked-out codebase.

Accordingly, the frontend can safely build API-independent primitives only after the visual system is approved. API-backed pages, forms, selectors, filters, edit, and delete flows remain blocked until the relevant contracts are jointly agreed. Frontend validation will aid usability only; the backend remains responsible for authorization, ownership, validation, and persistence.

### Documentation discrepancy to resolve

The current `main` branch contains the frontend authentication implementation, while `docs/00-governance/documentation-status.md` still describes DIV-007 as pending review. The project owner should reconcile that status before using the register as release evidence. This plan does not change the status register because the merged/review outcome is not established by this planning work.

## 2. Required pages

| Page | Proposed route | Purpose | Primary action | Required states | Dependency |
|---|---|---|---|---|---|
| Transactions | `/transactions` | Browse the authenticated user's transactions and enter the creation flow. | Add transaction, apply filters, open a record. | Initial loading, populated, empty, filtered empty, error, session ended, pagination. | TX-001; approved filter, sorting, and pagination semantics. |
| Add expense | `/transactions/new-expense` | Capture an expense with the minimum required details. | Save expense. | Category loading/empty/error, client field errors, server field errors, pending, success, network error, session ended. | TX-002 and category list contract. |
| Add income | `/transactions/new-income` | Capture an actual income record separately from planned income. | Save income. | Income-source loading/empty/error, client/server validation, pending, success, network error, session ended. | TX-002 and income-source contract. |
| Edit transaction | `/transactions/[id]/edit` | Correct an owned, active transaction. | Save changes or request deletion. | Record loading, not found/unavailable, client/server validation, pending, success, session ended. | TX-003 and TX-004; approved type-change policy. |
| Delete confirmation | Dialog from edit page or transaction row | Ask for deliberate confirmation before a destructive action. | Delete transaction. | Open, keyboard focus, pending, API error, success/close. | TX-005 and approved soft-delete lifecycle. |

The dashboard, budgets, custom-category management, income-source management, restore, and transaction detail page are deliberately outside this first frontend transaction slice. Existing sign-in, sign-up, onboarding, and root routing remain in place until a separately approved navigation and onboarding decision changes them.

## 3. Reusable component inventory

### Foundation and layout

| Component | Responsibility | First consumer |
|---|---|---|
| `AppShell` | Authenticated page frame with an accessible main region. Must retain `SessionGate` protection. | Transactions list |
| `PrimaryNavigation` | Desktop navigation with a programmatically identifiable current route. | `AppShell` |
| `MobileNavigation` | Compact mobile navigation; no colour-only active state. | `AppShell` |
| `PageHeader` | Consistent title, optional back link, and primary action slot. | All transaction pages |
| `BackLink` | Predictable return to the transaction list without guessing browser history. | Add/edit pages |

### UI primitives and feedback

| Component | Responsibility | Notes |
|---|---|---|
| `Button` | Primary, secondary, tertiary, and destructive actions with disabled and loading states. | Button wording names the action. |
| `FormField` | Label, hint, required indicator, input association, and field error wrapper. | May evolve `TextField`; do not duplicate its accessibility behavior. |
| `SelectField` | Accessible native select initially, with label, hint, empty option, and error support. | Avoid a custom combobox unless it becomes necessary. |
| `DateField` | Date-only control. | Must use the approved date/timezone semantics. |
| `MoneyInput` | Controlled decimal-string entry with currency context. | No floating-point calculation or display-text parsing. |
| `TextAreaField` | Optional description input with character guidance once the limit is approved. | |
| `FormErrorSummary` | Focusable, announced list of validation problems after failed submission. | Required for multi-field forms. |
| `LoadingState` | Consistent screen or section loading message. | |
| `EmptyState` | Clear no-data and filtered-no-results variants with an appropriate CTA. | |
| `ErrorState` | Safe retry-oriented network/server failure UI. | Never expose server internals. |
| `InlineNotice` | Non-error success or information feedback. | |
| `ConfirmDialog` | Accessible destructive confirmation: labelled, focus-managed, escapable, and non-nestable. | Used only after deletion semantics are approved. |

### Transaction domain components

| Component | Responsibility | Data supplied by |
|---|---|---|
| `TransactionForm` | Shared form composition and pending/submit behavior; delegates type-specific fields. | Add/edit page and feature state |
| `TransactionTypeFields` | Renders the approved expense-only or income-only fields. | `TransactionForm` |
| `CategorySelect` | Shows usable expense categories with their Kakeibo group. | Category query result |
| `IncomeSourceSelect` | Shows usable income-source labels, if a source is required or optional. | Income-source query result |
| `TransactionList` | Renders a semantic list of rows and its state slots. | Transaction list page |
| `TransactionRow` | Shows date, category/source, description, signed amount, and edit affordance. | `TransactionList` |
| `TransactionTypeBadge` | Text and icon/shape representation of income or expense; never colour alone. | `TransactionRow` |
| `TransactionFilters` | Form controls for only the filters supported by TX-001. | Transaction list page |
| `PaginationControls` | Accessible pagination or load-more control once the server contract is finalized. | Transaction list page |
| `MoneyAmount` | Centralized LKR formatting for API decimal strings. | Rows and confirmations |
| `DateLabel` | Centralized date-only rendering. | Rows and form context |

## 4. Proposed folder and component structure

This extends the established repository layout rather than introducing a `src/` move or a state-management library.

```text
frontend/
├── app/
│   ├── transactions/
│   │   ├── page.tsx                     # list route
│   │   ├── new-expense/page.tsx          # expense route
│   │   ├── new-income/page.tsx           # income route
│   │   └── [id]/edit/page.tsx            # edit route
│   └── layout.tsx                         # retains AuthProvider
├── components/
│   ├── feedback/                          # existing FormAlert + generic states
│   ├── forms/                             # generic field controls
│   ├── layout/                            # AppShell and navigation
│   ├── financial/                         # MoneyAmount and TransactionTypeBadge
│   └── ui/                                # Button, ConfirmDialog, EmptyState
├── features/
│   └── transactions/
│       ├── TransactionForm.tsx
│       ├── TransactionList.tsx
│       ├── TransactionFilters.tsx
│       ├── CategorySelect.tsx
│       ├── IncomeSourceSelect.tsx
│       ├── transactionApi.ts              # only after contract approval
│       ├── transactionTypes.ts             # contract-aligned types
│       └── validation.ts
├── lib/
│   ├── api/client.ts                       # existing sole fetch boundary
│   ├── money.ts
│   └── dates.ts
├── types/
│   └── api/transactions.ts                # optional if shared across features
└── tests/
    ├── transactions-*.test.tsx
    └── transaction-api.test.ts
```

Route files compose features and own route-level loading/error choices. Feature components own transaction-specific local state and validation. Shared components are presentational and do not call the API. `transactionApi.ts` must use `lib/api/client.ts`; it must not introduce direct `fetch()` calls, a separate credential policy, or a second CSRF implementation.

## 5. Page-by-page delivery plan

| Order | Deliverable | Dependencies | Completion evidence |
|---|---|---|---|
| 0 | Approve visual tokens, authenticated navigation, and the Phase 02 contract decisions listed below. | Owner and backend/frontend agreement. | Approved decisions and updated API/OpenAPI documents. |
| 1 | Build generic, API-independent primitives: button, field wrappers, safe feedback states, money/date display utilities, and confirmation dialog. | Approved visual/accessibility rules; approved money/date formatting policy for final behavior. | Component tests for labels, errors, disabled/loading states, keyboard focus, and narrow layout. |
| 2 | Add `AppShell`, desktop/mobile navigation, and protected transaction route frame. Do not redirect the established authenticated home until navigation/onboarding behavior is approved. | Approved navigation destination and route transition decision. | Session-gate regression tests; keyboard navigation checks. |
| 3 | Define transaction/category/income-source TypeScript models and API adapter methods from the approved OpenAPI contract. | Approved TX-001 through TX-005 and supporting category/income-source endpoints. | API-client contract tests for credentials, CSRF, error normalization, and 204 deletion. |
| 4 | Implement expense quick entry against real category and transaction APIs. | Category list available; create expense request/response and validation approved. | Component tests for required fields, pending duplicate prevention, retained values, validation, and success. |
| 5 | Implement the transaction list and approved filters/pagination. | List response semantics, default ordering, date filter rules, and category relation agreed. | Loading, empty, filtered-empty, error, and pagination tests. |
| 6 | Implement income entry. | Income-source contract and required/optional source rule approved. | Income-specific validation and successful create/list refresh tests. |
| 7 | Implement edit and deletion confirmation. | Read/update/delete semantics, type-change rule, soft-delete lifecycle, and summary-refresh behavior approved. | Not-found, ownership-safe response, edit, confirm/cancel, delete-pending, and list-refresh tests. |
| 8 | Run the complete real-backend journey: sign in → add expense/income → reload/list → edit → delete where approved → sign out/session expiry. | Integrated backend endpoints and disposable test database. | Playwright coverage plus documented manual responsive/accessibility checks. |

For every save, disable duplicate submission while pending, preserve values after a recoverable failure, display success only after a successful server response, and route a `401` through the existing `AuthProvider` session-ended flow.

## 6. Required clarification before API integration

### Blocking transaction decisions

1. Approve the transaction endpoint schemas and make `transactions-api.md` and `openapi.yaml` agree, including field names and error codes.
2. Define amount rules: accepted decimal separator, maximum scale, maximum range, whether trailing zeroes are normalized, and whether input is rejected or rounded.
3. Define the date policy: default date, allowed past/future range, user timezone source, and inclusive date-filter boundaries.
4. Confirm expense required/optional fields: category, description, and payment-method values.
5. Confirm income required/optional fields and whether an income source is mandatory; clarify the relationship between actual income records and planned income.
6. Confirm category availability, ordering, Kakeibo-group presentation, and what the UI does when no usable categories exist.
7. Confirm income-source endpoint and empty-state strategy. Do not build a production source selector against hard-coded choices.
8. Decide duplicate-submission/idempotency behavior. Client pending state prevents accidental double clicks but cannot protect against all retries/timeouts.
9. Finalize list defaults: ordering, allowed sort fields, page-size bounds, filter combinations, and whether description search is supported.
10. Decide update behavior: whether `type` can change, which dependent fields must be cleared/reselected, and the response representation after update.
11. Decide deletion scope: whether soft deletion is in the MVP, exact confirmation copy, response shape, normal-list exclusion, downstream summary invalidation, retention, and whether restore is deferred.
12. Define safe not-found/forbidden behavior for read, edit, update, and delete so the UI does not reveal another user's records.

### Design and navigation decisions

1. Approve the design token values, typography, colour palette, and dark-mode scope before applying a wider UI visual system.
2. Confirm the first authenticated destination after sign-in. It is currently `/onboarding`; the proposed information architecture expects a dashboard, but onboarding rules remain unresolved.
3. Confirm whether transaction creation is separate routes (the current proposal) or an add menu/dialog, and the post-save return location.
4. Confirm responsive navigation choice: desktop sidebar/top navigation and mobile bottom navigation are proposals only.
5. Confirm accessible currency and date formatting requirements for the initial English/LKR-only release.

## 7. Explicitly out of scope for this slice

- Backend endpoints, entities, database migrations, seed data, and changes to OpenAPI contracts.
- Dashboard calculations, budgets, insights, reflection, bank sync, transfers, account balances, recurring entries, shared expenses, and money lending.
- Custom category or income-source management until those P1 contracts and lifecycle rules are approved.
- Restore UI, unless deletion/restore is explicitly approved for the MVP.

## 8. Reference mapping

- Phase: [PHASE-02-transactions.md](../10-phases/PHASE-02-transactions.md)
- User stories: US-004 through US-008 in [user-stories.md](../03-requirements/user-stories.md)
- Acceptance criteria: AC-006 through AC-014, AC-026, AC-030 through AC-032 in [acceptance-criteria.md](../03-requirements/acceptance-criteria.md)
- UX: UX-P05 through UX-P08 in [pages-and-components.md](../02-ux-ui/pages-and-components.md), [wireframes.md](../02-ux-ui/wireframes.md), and [navigation-map.md](../02-ux-ui/navigation-map.md)
- API proposals: [transactions-api.md](../05-api/transactions-api.md) and [categories-api.md](../05-api/categories-api.md)
- Architecture: [frontend-architecture.md](../04-architecture/frontend-architecture.md)
