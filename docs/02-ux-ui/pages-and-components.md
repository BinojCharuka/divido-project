# Pages and Component Inventory

**Status:** Proposed — owner review required

## 1. Page inventory

| ID | Page | Purpose | Primary action | Key states |
|---|---|---|---|---|
| UX-P01 | Sign in | Authenticate returning user | Sign in | Invalid credentials, loading, server error |
| UX-P02 | Create account | Register a user | Create account | Field errors, duplicate/non-sensitive error, success |
| UX-P03 | Onboarding | Collect initial preferences and plan | Continue/finish | Step validation, save failure, resume |
| UX-P04 | Dashboard | Current-month overview | Add expense/income | No plan, no activity, loading, partial data |
| UX-P05 | Transactions | Browse records | Add/filter/open record | Empty, filtered empty, loading, pagination |
| UX-P06 | Add expense | Record spending | Save expense | Validation, saving, success, API error |
| UX-P07 | Add income | Record income | Save income | Validation, saving, success, API error |
| UX-P08 | Edit transaction | Update owned record | Save changes | Not found, deleted, validation, success |
| UX-P09 | Budget | Review monthly plan | Edit/save plan | No plan, over-allocation warning, save error |
| UX-P10 | Insights | Explain spending patterns | Review insight | Insufficient data, no insight, error |
| UX-P11 | Reflection | Save monthly reflection | Save/skip | Empty, draft, saved, error |
| UX-P12 | Settings | Manage preferences | Save settings | Loading, validation, error |
| UX-P13 | Categories | Manage custom categories | Add/edit/deactivate | Empty, duplicate, conflict, error |
| UX-P14 | Income sources | Manage source labels | Add/edit/deactivate | Empty, duplicate, conflict, error |

Reflection, access recovery, deleted-items restore, and some settings subpages may be excluded or deferred after owner approval.

## 2. Shared components

### Application shell
- `AppShell`
- `PrimaryNavigation`
- `MobileNavigation`
- `PageHeader`
- `ProfileMenu`
- `ProtectedRoute` or equivalent routing wrapper (UX convenience only; not a security boundary)

### Financial display
- `MoneyAmount`
- `PeriodLabel`
- `PlannedActualLabel`
- `GroupBudgetCard`
- `IncomeSummary`
- `SavingsTargetSummary`
- `BudgetProgress`
- `TransactionRow`
- `TransactionTypeBadge` (must include text/icon, not color only)

### Forms
- `MoneyInput`
- `CategorySelect`
- `GroupDescription`
- `DateInput`
- `DescriptionInput`
- `PaymentMethodSelect`
- `IncomeSourceSelect`
- `FormField`
- `FieldError`
- `FormErrorSummary`
- `SubmitButton`

### Feedback and state
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `InlineNotice`
- `SuccessToast` or inline confirmation
- `ConfirmDialog`
- `SessionExpiredNotice`
- `PaginationControls` or approved load-more control

### Insights and reflection
- `InsightCard`
- `InsightEvidence`
- `InsufficientHistoryState`
- `ReflectionQuestion`
- `ReflectionAnswerField`

## 3. Component contracts

- Components display data passed from a page/service layer; they must not independently call backend endpoints unless the frontend architecture explicitly standardizes that pattern.
- Shared components must not contain hidden business rules for budget calculations, group assignment, or habit detection.
- Money formatting must be centralized.
- Form components expose labels, helper text, validation messages, disabled state, and accessible names.
- Loading and submit states prevent duplicate actions where duplicates would create duplicate records.
- Errors must be actionable and safe; never display stack traces or database messages.
- `BudgetProgress` must include a numeric/textual explanation in addition to any visual bar.
- A category selector must show the category name and group mapping clearly enough to support correct selection.

## 4. Data ownership and boundaries

- Frontend may do immediate validation for usability, but backend validation is authoritative.
- Backend owns calculations that affect financial summaries, group allocation, insight eligibility, authorization, and persistence.
- Frontend must not infer that a save succeeded based only on a button click.
- A successful API response or confirmed refresh determines the success state.
- Do not use hard-coded demo totals in production UI.
- Use typed API response models and a consistent error shape from the API contract.

## 5. Responsive component expectations

- Buttons and fields have comfortable touch targets.
- Forms are single-column on narrow screens.
- Lists use stacked rows on mobile.
- Modal content fits viewport height and supports scrolling.
- Long category names and descriptions wrap safely.
- Large amounts do not overflow cards; define a fallback for narrow widths.

## 6. Frontend implementation handoff

Before implementing a page, link it to:
1. Product requirement/user story ID.
2. Approved flow and wireframe.
3. API endpoint and response schema.
4. Loading/empty/error/success behavior.
5. Frontend and API tests.
6. Accessibility and responsive checks.

If any of these are missing, mark the page as blocked or record a deliberate owner-approved exception.
