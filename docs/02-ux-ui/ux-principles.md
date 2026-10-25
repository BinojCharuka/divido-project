# UX Principles

**Status:** Proposed — owner review required

## 1. Product experience goal

Divido should help a person become more conscious of their money decisions, not shame them for spending. The interface should make recording money simple, reviewing patterns understandable, and monthly reflection actionable.

## 2. Principles

### 2.1 Low-friction recording
- A common expense should be recordable with the fewest practical steps.
- Amount and category are required for an expense.
- Date defaults to today; description and payment method are optional.
- Preserve valid form input after a recoverable server error.
- Do not add extra required fields unless the owner approves the product requirement.

### 2.2 Calm, non-judgmental language
- Prefer “You spent more than planned in Wants” over “You failed your budget.”
- Avoid shame, guilt, streak pressure, or competitive comparisons.
- Insights are observations, not diagnoses or financial advice.
- Allow the user to skip reflection questions.

### 2.3 Kakeibo-informed, not rigid
- Present the four proposed groups consistently: Needs, Wants, Culture, Unexpected.
- Explain the meaning of each group at the point where the user chooses it.
- Do not silently reclassify a transaction. Any automatic suggestion must be clearly presented as a suggestion and require confirmation.
- Category-to-group mapping must come from the approved category data/rules, not hard-coded UI assumptions.

### 2.4 One understandable money picture
- Show one overall money view for MVP; do not imply account-level balances.
- Distinguish planned income, recorded income, spending, and savings target.
- Label the period for every total.
- Make clear whether a number is a plan, an actual, or a calculated estimate.

### 2.5 Progressive disclosure
- Keep the default dashboard focused on the most useful current-month information.
- Put details, explanations, and secondary actions behind clearly named links or expandable sections.
- Do not overload the first-run experience with every setting.

### 2.6 Trust and user control
- Confirm destructive or financially meaningful actions.
- Use soft-delete behavior where specified; show when an item is in the trash/archive and provide a restore route if supported.
- Never suggest that recording a loan or expense moves real money.
- Explain when insights lack enough history to be meaningful.

### 2.7 Predictability
- Use the same names for categories, groups, periods, and actions across all pages.
- Use consistent date, currency, empty-state, loading, and error patterns.
- Do not make navigation change unexpectedly based on viewport.

## 3. Content and terminology

Use English for the initial release. Use plain language:
- “Add expense”
- “Add income”
- “Planned income”
- “Recorded income”
- “Monthly savings target”
- “Budget remaining”
- “Review this month”

Avoid unexplained technical terms such as “transaction ledger,” “aggregation,” or “anomaly.”

## 4. Financial display rules

- Default currency: LKR, pending owner approval.
- Use a single currency formatter across the frontend.
- Do not show more decimal places than the currency/use case requires; owner must approve exact rounding policy.
- Negative values must have a clear sign or label, not color alone.
- Every summary must indicate the period and whether it is planned or actual.
- A zero value must not be confused with missing data.
- If data is unavailable, show “Not available” or an appropriate empty state rather than a fabricated zero.

## 5. Responsive behavior

- Design mobile-first.
- On small screens, use a single-column content flow and a clear primary action.
- On wider screens, content may use a constrained main column and secondary summary panels.
- Avoid horizontal scrolling for core forms and summary cards.
- Dense tables should become readable stacked rows or use an explicitly approved responsive pattern.

## 6. Needs owner decision

- Final brand voice and product name styling.
- Exact currency formatting and rounding rules.
- Whether dashboard quick actions are fixed or configurable.
- Whether users can customize group descriptions.
- Exact behavior and wording for soft-deleted records.
