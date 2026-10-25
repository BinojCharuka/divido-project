# Frontend Roadmap

**Status:** Proposed sequence — owner and developer review required  
**Stack assumption:** Next.js frontend in `frontend/`. Confirm the actual installed framework version and conventions before implementation.

## 1. Principles

- Build by user journey, not by isolated visual pages.
- Keep UI components separate from API transport and domain-specific mapping.
- Treat backend validation as authoritative; frontend validation improves usability but is not a security boundary.
- Every screen must define loading, empty, error, and success states.
- Use accessible labels, keyboard navigation, visible focus, and appropriate contrast.
- Avoid inventing product rules in components. Link rules to `docs/03-requirements/business-rules.md`.

## 2. Suggested sequence

### FE-00 — Repository and app foundation

- Confirm package manager, Next.js version, TypeScript settings, linting, formatting, and test runner.
- Establish route/layout conventions and shared page shell.
- Add environment-variable validation for public configuration.
- Document local run, test, and build commands.
- Keep private API secrets off the client. Only explicitly public values may use public environment-variable prefixes.

**Exit criteria:** app installs reproducibly; lint/typecheck/test/build commands are documented and runnable.

### FE-01 — Design primitives and navigation

- Define typography, spacing, color tokens, responsive breakpoints, form controls, alerts, dialogs, and reusable loading/empty/error states.
- Build the navigation and page shell appropriate to the approved information architecture.
- Confirm mobile-first layout and keyboard usability.

**Exit criteria:** core layout and primitives work at target viewport sizes and pass basic accessibility checks.

### FE-02 — Authentication and onboarding UI

- Implement login/logout and session-aware navigation against the agreed auth API.
- Implement onboarding/profile form only after fields and required/optional behavior are approved.
- Handle session expiry and unauthorized responses without losing unsaved form data where feasible.
- Do not store session identifiers in localStorage or expose HttpOnly session cookies to JavaScript.

**Exit criteria:** unauthenticated and authenticated flows are clearly handled; server remains authoritative for authorization.

### FE-03 — Categories and income sources

- Load built-in categories and user-created categories from the API.
- Implement category selection and custom-category creation if in approved MVP scope.
- Implement income-source management only after its endpoint contract is agreed.
- Handle empty lists and duplicate-name validation.

**Exit criteria:** category and income-source forms use real API responses and display server validation correctly.

### FE-04 — Income and expense transactions

- Build fast transaction-entry forms with clear required fields and sensible date defaults.
- Implement list, filter, edit, and soft-delete/restore only as defined in approved stories.
- Show validation inline and preserve entered values after recoverable errors.
- Prevent accidental duplicate submission while a request is pending.
- Ensure amounts, currency, date/time, and decimal precision follow the API contract.

**Exit criteria:** core create/list/update/delete-or-restore journeys work against the backend and are covered by tests.

### FE-05 — Budgets and dashboard

- Build monthly planning forms only after income, group allocations, savings target, and warning rules are approved.
- Display budget totals with clear distinction between planned values and actual transactions.
- Keep dashboard calculations sourced from API responses unless a documented contract explicitly assigns a calculation to the client.
- Define month navigation and timezone behavior consistently.

**Exit criteria:** dashboard totals reconcile with known test fixtures and do not silently mix planned and actual values.

### FE-06 — Insights and reflection

- Add spending-habit suggestions only after the habit algorithm and minimum-data rules are agreed.
- Clearly label insufficient data; avoid presenting a weak pattern as a fact.
- Build reflection questions and saved responses only against approved retention and editability rules.
- Include empty and low-confidence states.

**Exit criteria:** insights are explainable, appropriately qualified, and tested for insufficient or boundary data.

### FE-07 — Hardening and release readiness

- Check responsive layouts, keyboard use, focus order, screen-reader labels, error boundaries, and network failures.
- Verify cookie/CSRF integration against the actual backend setup.
- Remove temporary mocks and development-only shortcuts.
- Confirm production build and browser-level critical journeys.

**Exit criteria:** no known release-blocking UI, accessibility, integration, or security issue remains.

## 3. Suggested frontend structure

Treat this as a proposal, not a requirement to reorganize the existing repository:

```text
frontend/
  src/
    app/                  # routes and layouts
    components/
      ui/                 # reusable primitives
      layout/             # navigation and shell
    features/
      auth/
      profile/
      categories/
      income-sources/
      transactions/
      budgets/
      dashboard/
      insights/
      reflections/
    lib/
      api/                # transport, typed responses, error mapping
      config/
      validation/
    types/
```

Follow the existing project conventions if the repository already has a sound structure. Avoid creating wrappers or abstractions that are not needed.

## 4. API client rules

- Centralize base URL and credential handling.
- Use the agreed cookie/session and CSRF mechanism.
- Normalize API errors in one place, while preserving field-level validation details.
- Define typed request and response shapes from the API contract where practical.
- Do not duplicate server business rules as if the client were authoritative.
- Never log passwords, cookies, session IDs, or sensitive financial form payloads.
- Use mock data only for isolated UI development; label it and remove it from production flows.

## 5. Component state checklist

For each API-backed screen, define:

- Initial/loading state.
- Successful populated state.
- Empty state.
- Validation failure state.
- Authentication/session-expiry state.
- Network/server error state.
- Pending state to prevent duplicate actions.
- Success feedback and navigation behavior.
- Unsaved-change behavior when navigating away.

## 6. Frontend tests

- Unit tests for formatting, validation helpers, and meaningful component logic.
- Component tests for forms, errors, loading states, and keyboard interactions.
- API-client tests for credentials, CSRF header behavior, and error mapping.
- End-to-end tests for high-value journeys once the test environment is available.
- Visual snapshots only where they provide stable value; avoid brittle snapshot-only coverage.

See [test strategy](../08-testing/test-strategy.md) and [frontend test cases](../08-testing/frontend-test-cases.md).

## 7. Dependencies and gates

Do not finalize the UI for onboarding, spending insights, budget warning logic, or retention-sensitive features until their corresponding product decisions are approved. Record open questions in the issue rather than filling gaps with arbitrary UI assumptions.
