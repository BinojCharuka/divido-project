# Frontend Architecture

**Status:** Proposed — confirm against current Next.js version and repository conventions

## 1. Goals

Keep the frontend predictable, accessible, testable, and aligned with API contracts. Use a small structure appropriate for an MVP; avoid premature abstractions.

## 2. Suggested structure

Adapt this to the existing repository rather than blindly recreating it:

```text
frontend/
├── app/                         # Routes/layouts (App Router if current app uses it)
│   ├── (public)/
│   ├── (authenticated)/
│   └── api/                     # Only if server-side route handlers are intentionally used
├── components/
│   ├── layout/
│   ├── forms/
│   ├── financial/
│   ├── feedback/
│   └── ui/
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── transactions/
│   ├── budget/
│   ├── dashboard/
│   ├── insights/
│   ├── reflection/
│   └── settings/
├── lib/
│   ├── api-client.ts
│   ├── auth/
│   ├── money.ts
│   ├── dates.ts
│   ├── validation/
│   └── errors.ts
├── types/
│   └── api/
└── tests/
```

This is a target suggestion, not a requirement to move existing files. Confirm whether the app uses App Router or Pages Router before implementing route-specific patterns.

## 3. Layer responsibilities

- **Route/page layer:** compose feature components and coordinate loading.
- **Feature layer:** user-task components and feature-specific state.
- **Shared components:** reusable presentational UI with accessibility behavior.
- **API client:** base URL, credential policy, CSRF handling, JSON parsing, and normalized errors.
- **Types/schema layer:** request/response types and runtime validation where useful.
- **Formatting utilities:** one money formatter and one approved date/time policy.
- **Tests:** component, flow, and integration tests appropriate to the existing toolchain.

Avoid scattering raw `fetch()` calls, backend URLs, or ad-hoc error parsing across components.

## 4. API client contract

The shared API client should:
- Use the configured API base URL.
- Include session credentials according to deployment topology.
- Include the approved CSRF token/header for state-changing requests.
- Set and expect JSON content types where appropriate.
- Parse the documented error format safely.
- Handle empty responses such as successful deletion if the API defines them.
- Never log passwords, cookies, CSRF tokens, or full sensitive payloads.
- Distinguish network failure, unauthenticated response, validation failure, forbidden/not-found response, rate limit, and server error.

Exact endpoint types are defined in Set 5, not invented independently by each page.

## 5. State management

- Prefer local component state for isolated forms.
- Use a shared query/cache approach only if already present or approved; avoid introducing a state library without need.
- Refresh or invalidate affected dashboard, budget, and transaction data after a successful write.
- Do not optimistically show a saved financial record unless rollback and failure handling are designed.
- Preserve form values after recoverable errors.
- Prevent duplicate form submission while a request is pending.

## 6. Route protection

Client-side redirects improve UX only. They are not a security boundary. Backend endpoints must enforce authentication and ownership.

If server-rendered route protection is used, it must be compatible with the chosen session-cookie topology and Next.js version. Never expose session secrets to client JavaScript.

## 7. Money and date handling

- Keep money values in a safe representation from API through calculation/display; follow the API contract for decimal strings versus JSON numbers.
- Do not use JavaScript floating-point arithmetic as the authoritative budget calculator.
- Keep date-only values distinct from timestamps.
- Use the approved user timezone for “today” and month boundaries.
- Centralize LKR display formatting; do not parse formatted display text back into business values.

## 8. Testing expectations

- Unit tests for formatters and client error normalization.
- Component tests for validation and accessible labels.
- Flow tests for sign-in, add expense/income, budget save, and session expiry.
- Contract tests or fixtures tied to the documented API schema.
- Responsive and keyboard checks for core pages.

## 9. Implemented structure (DIV-041, 2026-11-16)

DEC-029 (approved 2026-11-16) makes the Figma design the production UI. DIV-041 rebuilt it in these layers:

```text
frontend/
├── app/
│   ├── (public)/            # sign-in, sign-up, onboarding (redirects to /dashboard until DIV-023)
│   ├── (authenticated)/     # layout.tsx = SessionBoundary + AppShell; one thin page.tsx per route
│   └── page.tsx             # redirects by session state
├── components/
│   ├── auth/                # SessionBoundary, SessionGate
│   ├── layout/              # AppShell, Sidebar, TopBar, MobileDock, PageHeading, dialogs, navigation config
│   ├── ui/                  # Button, IconButton, Modal, Pagination, Brand
│   ├── forms/               # InputField, SelectField, MoneyField, TextField
│   ├── financial/           # GroupBadge, Money, MonthSelector, group metadata
│   └── feedback/            # LoadingPanel, InlineError, FieldError/FormError, ConfirmDialog, ComingLater
├── features/
│   ├── auth/                # sign-in/sign-up screens and forms
│   ├── dashboard/           # DashboardPage + SummaryCards, GroupProgressCard, PlanSummary, FreshMonthNotice
│   ├── budget/              # BudgetPage + useBudgetForm, BudgetTotals, GroupAllocationCard, BudgetSaveBar
│   ├── transactions/        # TransactionsPage, filters, rows, add/detail/edit/delete dialogs
│   ├── categories/          # CategoriesPage, CategoryCard, CategoryFormDialog, GroupFilterTabs
│   ├── income-sources/      # IncomeSourcesPage, IncomeSourceCard, IncomeSourceFormDialog
│   ├── settings/, insights/, reflection/   # insights and reflection show "coming later" (DEC-030 open)
│   └── entry/               # home and onboarding redirects
├── lib/                     # api/, auth/, budget/, formatting/, validation/, transactions/, useApiData, theme
└── styles/                  # figma-styles.css, design-system.css (Figma tokens), app.css (app states)
```

- Route files are server components that export `instant = false` and render one client entry from `features/`. Pages are client-rendered behind the session check, so there is no instant shell to validate.
- The app shell owns the toast and the transaction dialogs. Pages reach them through `useAppShell()`, and refetch when `dataVersion` changes after a confirmed write.
- `useApiData` gives every load the same loading / error-with-retry / ready states. Server error details are not shown.
- Figures come from the API. The budget form previews totals with exact whole-cent arithmetic (`lib/budget/plan.ts`) and shows the server's figures once saved. There is no "available money" figure (BR-008).
- Prototype-only features with no API (search, CSV export, notifications, profile editing, sample insights and reflections, workspace reset) are not shipped.

## 10. Before implementation

Inspect the current `package.json`, lockfile, route structure, lint/test scripts, and existing components. Keep existing conventions unless an ADR approves a change.
