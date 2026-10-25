# Design System

**Status:** Proposed — visual tokens and brand styling need owner approval

## 1. Purpose

Establish a small, consistent UI system before individual screens drift apart. This document defines semantic roles and behavior, not final brand colors or a pixel-perfect design.

## 2. Visual direction proposal

- Calm, warm, clear, and trustworthy.
- Financial information should be legible before decorative.
- Use whitespace and restrained surfaces to reduce cognitive load.
- Avoid aggressive red/green emotional coding for financial performance.
- Avoid gamification that pressures users to spend less or maintain streaks.

Exact palette, font, logo, radius, shadows, and illustration style are TBD and require owner approval.

## 3. Semantic tokens

Create CSS variables/design tokens rather than scattering literal values across components.

### Color roles
- `color-background`
- `color-surface`
- `color-text-primary`
- `color-text-secondary`
- `color-border`
- `color-primary`
- `color-primary-contrast`
- `color-success`
- `color-warning`
- `color-danger`
- `color-info`
- `color-focus`

Every status color must also have text or an icon/label. Check contrast in all supported themes if dark mode is later approved.

### Spacing
Use a consistent spacing scale. Proposed base: 4 CSS pixels, with components using multiples of that base. Avoid arbitrary one-off gaps.

### Typography
- Page title
- Section heading
- Card title
- Body
- Secondary/helper text
- Form label
- Error/validation text
- Numeric financial value

Use tabular numerals for aligned financial values where supported. Keep helper and error text readable; do not shrink important content to fit.

### Shape and elevation
- Consistent input/button/card radii.
- Minimal elevation; use borders and spacing before shadows.
- Focus rings must remain clearly visible.
- Do not communicate clickability only through shadows.

## 4. Component states

Every interactive component should define:
- Default
- Hover (where relevant)
- Focus-visible
- Active/pressed
- Disabled
- Loading (where relevant)
- Error/invalid
- Selected/current
- Success (where relevant)

Disabled controls must remain understandable. If an action cannot be taken, explain why nearby where appropriate.

## 5. Buttons

Proposed hierarchy:
- Primary: one dominant action per page or form, e.g. Save expense.
- Secondary: safe alternative, e.g. Cancel.
- Tertiary/text: navigation or low-emphasis action.
- Destructive: explicit destructive style and confirmation where needed.

Do not use a primary button for every action on the same screen. Button text should name the action.

## 6. Forms

- Visible persistent labels; placeholders are examples, not replacements for labels.
- Required fields marked in text and programmatically.
- Validation runs at a helpful time; avoid announcing errors before the user has had a reasonable chance to interact.
- Error text explains how to correct the value.
- Keep entered data after recoverable failures.
- Format currency without changing the underlying value unexpectedly while typing.
- Confirm whether comma/decimal separators are accepted and normalize safely at the API boundary.

## 7. Financial charts and progress

- Include text labels, units, period, and accessible summary.
- Never rely on color alone to distinguish groups or income/expense.
- Do not draw a progress bar with a misleading denominator.
- When spending exceeds a budget, clearly show the numeric overage.
- Handle zero budget and no data explicitly; avoid divide-by-zero/NaN UI.
- Ensure chart content is understandable without hover.

## 8. Motion

- Motion is optional and restrained.
- Never make essential information dependent on animation.
- Respect reduced-motion preferences.
- Avoid large animated count-ups for money totals.

## 9. Design-system acceptance

- Tokens are centralized and documented.
- Components use semantic roles rather than one-off styling.
- Keyboard focus is visible.
- Contrast is checked against WCAG 2.2 AA targets.
- Layout has been checked at 320 CSS pixels and common tablet/desktop widths.
- Brand and visual-token choices have owner approval before being marked final.
