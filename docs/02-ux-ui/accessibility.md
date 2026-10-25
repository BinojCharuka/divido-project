# Accessibility Requirements

**Status:** Proposed — required quality baseline

## 1. Standard

Target WCAG 2.2 Level AA for MVP. Accessibility is part of acceptance criteria, not a post-release polish task.

## 2. Keyboard and focus

- All interactive elements are reachable and operable by keyboard.
- Focus order follows visual and task order.
- Focus is visible and not hidden behind sticky navigation or overlays.
- Dialogs manage focus when opened and return focus to the invoking control when closed.
- Escape closes dismissible dialogs where appropriate.
- No keyboard trap except within a correctly implemented modal interaction, with a clear exit.

## 3. Semantics and screen readers

- Use semantic headings in a logical hierarchy.
- Use real buttons for actions and links for navigation.
- Inputs have programmatic labels and associated helper/error text.
- Required state is exposed programmatically, not just with an asterisk.
- Dynamic success/error messages are announced appropriately without excessive announcements.
- Active navigation and selected filters expose their state.
- Icons that are decorative are hidden from assistive technology; icon-only controls have accessible names.

## 4. Color and visual presentation

- Meet WCAG AA contrast for text and meaningful UI boundaries.
- Do not use color as the only signal for income/expense, warnings, active navigation, or budget overage.
- Support browser zoom/reflow without losing functionality.
- Text remains readable at 200% zoom and the layout should reflow at narrow widths.
- Do not use very small text for financial details, helper text, or errors.

## 5. Forms and validation

- Every field has a persistent label.
- Validation errors identify the field and explain the correction.
- When submission fails, provide an error summary or focus the first invalid field when appropriate.
- Do not rely only on color, shaking, or a toast that disappears quickly.
- Ensure keyboard users can reach and correct every invalid field.
- Preserve form values after server/network failures where safe.

## 6. Financial data and charts

- Currency values include context such as “Planned income” or “Spent.”
- Charts have text summaries or accessible data alternatives.
- Progress indicators expose numeric values and labels.
- Group distinctions use labels/patterns/icons in addition to color.
- Screen-reader output should not read decorative currency symbols or repeated labels in a confusing order.

## 7. Touch and responsive design

- Interactive targets should be at least 24 by 24 CSS pixels, subject to WCAG 2.2 AA exceptions; aim for approximately 44 by 44 CSS pixels for common touch actions.
- Controls do not overlap at narrow widths.
- Core tasks work in portrait orientation.
- Avoid horizontal scrolling for forms and primary dashboard content.

## 8. Testing checklist

- Keyboard-only run through sign-in, onboarding, add expense, add income, edit transaction, budget, and settings.
- Screen-reader smoke test with at least one supported browser/screen-reader combination.
- Automated accessibility scan as a supplement, not a replacement for manual testing.
- Check focus states, form labels, errors, dialog behavior, contrast, zoom, and reduced motion.
- Verify chart/summary information without hover.
- Record known exceptions with a reason, owner, and remediation target; do not silently waive issues.
