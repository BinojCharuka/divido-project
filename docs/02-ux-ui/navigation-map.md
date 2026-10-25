# Navigation Map

**Status:** Proposed — owner review required

## 1. Proposed navigation

### Mobile
- Bottom navigation: Dashboard, Transactions, Budget, Insights.
- A visible “Add” action opens a compact choice: Expense or Income.
- Reflection is reachable from Dashboard and/or a monthly review prompt.
- Settings is reachable from the profile/menu area, not a permanent bottom-navigation item.

### Desktop
- Sidebar or top navigation for Dashboard, Transactions, Budget, Insights.
- “Add expense” and “Add income” remain visible primary actions.
- Settings is available from a profile/menu area.
- Reflection is linked from the monthly overview and Insights if retained.

This is a proposal, not a finalized visual layout. Test with actual viewport sizes before implementation is frozen.

## 2. Navigation behavior

- Keep the active destination visually and programmatically identifiable.
- Do not use color alone to indicate the current page.
- When opening an add/edit form from a list, provide a clear way back to the originating list.
- After saving a transaction, show confirmation and return to the originating context unless the user needs to correct a validation error.
- If saving fails, remain on the form and retain entered values when safe.
- A modal/drawer must support Escape where appropriate, focus management, and a clear close action.
- Avoid nested modals for core flows.

## 3. Route proposal

Final route names must align with the frontend repository conventions.

| Page | Proposed path | Access |
|---|---|---|
| Sign in | `/sign-in` | Public |
| Create account | `/sign-up` | Public |
| Onboarding | `/onboarding` | Authenticated, setup incomplete |
| Dashboard | `/dashboard` | Authenticated |
| Transactions | `/transactions` | Authenticated |
| Add expense | `/transactions/new-expense` | Authenticated |
| Add income | `/transactions/new-income` | Authenticated |
| Edit transaction | `/transactions/[id]/edit` | Authenticated, owner only |
| Budget | `/budget` | Authenticated |
| Insights | `/insights` | Authenticated |
| Reflection | `/reflection` | Authenticated, if MVP-approved |
| Settings | `/settings` | Authenticated |
| Categories | `/settings/categories` | Authenticated |
| Income sources | `/settings/income-sources` | Authenticated |

## 4. Route guards and recovery

- Client-side route guards improve navigation but are not a security boundary.
- Backend authorization must verify the session and resource ownership for every protected operation.
- An expired session should show a calm message and route to sign-in.
- Preserve a return path only if it is local, safe, and does not enable open redirects.
- A direct request for a missing/deleted resource should show a useful not-found state, not leak whether another user's resource exists.

## 5. Navigation QA

- All destinations are keyboard reachable.
- Active page is announced to assistive technology.
- Back navigation behaves consistently.
- Browser refresh on an authenticated route behaves correctly.
- Session expiry does not silently discard unsaved form input where it can reasonably be preserved safely.
- Mobile navigation remains usable at 320 CSS pixels.
