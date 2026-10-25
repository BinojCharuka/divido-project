# Divido UX/UI Documentation

**Status:** Proposed — owner review required  
**Set:** 2 — UX/UI  
**Depends on:** [Product overview](../01-product/product-overview.md), [MVP scope](../01-product/mvp-scope.md), [Scope and decisions](../01-product/scope-and-decisions.md), [Requirements](../01-product/requirements.md)

## Purpose

This set describes the proposed user experience, navigation, screens, flows, wireframes, component inventory, design system, and accessibility requirements for Divido's MVP. It is a shared contract for product, frontend, backend, QA, and AI coding agents.

These documents are not a final design file or a frozen specification. Any item marked **Proposed**, **TBD**, or **Needs owner decision** must be reviewed before implementation depends on it.

## Files in this set

- [UX principles](ux-principles.md)
- [Information architecture](information-architecture.md)
- [Navigation map](navigation-map.md)
- [User flows](user-flows.md)
- [Wireframes](wireframes.md)
- [Pages and components](pages-and-components.md)
- [Design system](design-system.md)
- [Accessibility](accessibility.md)

## Implementation rule

Do not invent product behavior from a mockup. If a screen requires a business rule, use the product requirements and business rules as the source of truth. When they conflict, pause and record the conflict in the decision log rather than silently choosing one.

## UX/UI acceptance checklist

- Every MVP page has a documented purpose, entry point, primary action, loading state, empty state, error state, and success feedback where relevant.
- Every primary flow has success, validation, and recovery paths.
- Forms describe required versus optional fields.
- Financial values are formatted consistently and never rely on color alone.
- Layouts work on narrow mobile screens and desktop widths.
- Keyboard access, focus visibility, labels, and accessible feedback are included.
- UI language starts in English; default currency is LKR and timezone is Asia/Colombo, subject to owner confirmation.
- UI does not imply bank connectivity, money transfers, multiple account balances, or lending-tracker functionality in MVP.
