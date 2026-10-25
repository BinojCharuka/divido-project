# Frontend Test Cases

**Status:** Proposed — align with actual routes and approved UI flows

## 1. General screen states

For every API-backed page or component, test relevant states:

- Initial/loading.
- Populated success.
- Empty data.
- Field-level validation.
- Server validation error.
- Network timeout/offline.
- Server error.
- Unauthenticated or expired session.
- Pending submission.
- Success feedback and navigation.
- Unsaved form values when a recoverable error occurs.

## 2. Navigation and accessibility

### FE-T-001 — Keyboard navigation
Navigate the page with keyboard only.
**Expected:** Interactive controls are reachable in a logical order; focus is visible; no keyboard trap exists.

### FE-T-002 — Accessible form controls
Inspect each input and validation message.
**Expected:** Inputs have accessible names; required fields and errors are communicated to assistive technology.

### FE-T-003 — Responsive layout
Test the agreed target viewport sizes, including a narrow mobile viewport.
**Expected:** Primary actions remain available, content is readable, and no critical control is clipped or inaccessible.

### FE-T-004 — Error feedback
Trigger a validation and network error.
**Expected:** Message is actionable, associated with the relevant control where possible, and does not reveal internal stack traces.

### FE-T-005 — Loading and pending actions
Slow or delay an API response.
**Expected:** Loading state is clear and repeated submission is prevented where appropriate.

## 3. Authentication and onboarding

### FE-AUTH-001 — Login validation
Submit empty and malformed values.
**Expected:** Helpful client feedback appears; backend remains authoritative.

### FE-AUTH-002 — Login failure
Use invalid credentials.
**Expected:** Safe error is shown and no protected screen is treated as authenticated.

### FE-AUTH-003 — Session-aware route
Open a protected route while logged out.
**Expected:** User is routed or prompted according to approved navigation behavior.

### FE-AUTH-004 — Session expiry
Expire the session and attempt an action.
**Expected:** User sees an authentication state, not a false success; recoverable input is preserved where safe.

### FE-ONB-001 — Onboarding validation
Leave required fields empty or invalid.
**Expected:** Field errors are accessible and entered valid values remain intact.

## 4. Category and income forms

### FE-CAT-001 — Category loading
Load category picker with success, empty, and error responses.
**Expected:** Each state is understandable; no fake categories silently replace a failed request.

### FE-CAT-002 — Custom category duplicate
Submit a duplicate category if custom categories are in scope.
**Expected:** Server conflict/validation is rendered in a helpful way.

### FE-INC-001 — Income source selection
If income sources are in scope, verify loading, selection, empty, and invalid-reference behavior.
**Expected:** Selected source matches the actual API identifier, not merely its display label.

## 5. Transaction entry

### FE-TXN-001 — Required fields
Submit with missing amount/category.
**Expected:** Required-field errors are shown and no API success is fabricated.

### FE-TXN-002 — Amount formatting
Enter valid and invalid decimal values, including the maximum allowed precision.
**Expected:** Input behavior and submitted value match the API contract; no floating-point rounding surprises are introduced.

### FE-TXN-003 — Date default
Open a new transaction form.
**Expected:** Default date follows the approved timezone/date rule; user can change it if allowed.

### FE-TXN-004 — Optional fields
Omit optional description/payment method fields.
**Expected:** Valid submission succeeds if the contract says they are optional.

### FE-TXN-005 — Server rejection
Submit a syntactically valid but server-invalid transaction.
**Expected:** Server message is mapped to the form; values are retained where safe.

### FE-TXN-006 — Duplicate click
Click submit repeatedly while pending.
**Expected:** UI avoids accidental duplicate requests; server response remains truthfully represented.

### FE-TXN-007 — List update
Create or edit a transaction and return to the list.
**Expected:** List reflects saved server data, with correct sort/filter behavior.

### FE-TXN-008 — Delete/restore
If supported, test confirmation, success, failure, and totals refresh.
**Expected:** UI behavior matches server state; deleted records are not shown as active if policy excludes them.

## 6. Budgets and dashboard

### FE-BUD-001 — Budget totals
Enter planned income, four group allocations, and savings target if those fields are approved.
**Expected:** Displayed arithmetic matches approved rules and labels distinguish planned from actual.

### FE-BUD-002 — Over-allocation warning
Set allocations and savings target beyond planned income.
**Expected:** Warning appears exactly as specified; UI does not silently rewrite values unless explicitly designed to.

### FE-DASH-001 — Dashboard reconciliation
Render known fixture response.
**Expected:** Displayed totals and group labels match the API payload; formatting does not change numeric meaning.

### FE-DASH-002 — Empty month
Load an empty month.
**Expected:** Empty/zero states are clear; charts and percentages do not crash.

### FE-DASH-003 — Month navigation
Navigate across month boundaries.
**Expected:** Query parameters and displayed month stay aligned; no off-by-one timezone errors.

## 7. Insights and reflections

### FE-INS-001 — Insufficient history
Render the API's insufficient-data response.
**Expected:** UI does not phrase the absence of evidence as a definite spending habit.

### FE-INS-002 — Explain insight
Render a valid insight.
**Expected:** User can understand what period/data supports it, according to approved copy requirements.

### FE-REF-001 — Reflection save failure
Attempt to save while API fails.
**Expected:** UI does not claim the reflection was saved and offers a clear retry path.

## 8. API client tests

Verify:
- base URL and environment config;
- credentials are sent only according to the chosen session setup;
- CSRF token/header behavior matches backend configuration;
- JSON content type and serialization;
- consistent error mapping for validation, unauthorized, forbidden, not-found, conflict, and server errors;
- no token/cookie/password is written to logs;
- failed requests are not silently replaced with production mock data.

## 9. Frontend test reporting

For each test, record test ID, route/component, browser/runtime, result, and issue link. Prefer semantic queries by accessible role/name over fragile selectors tied to CSS class names.
