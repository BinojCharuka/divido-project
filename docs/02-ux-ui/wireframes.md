# Low-Fidelity Wireframes

**Status:** Proposed — conceptual text wireframes, not final visual design

Wireframes define content hierarchy and interaction intent. They do not prescribe exact colors, spacing, typography, or final component implementation.

## 1. Dashboard

```text
┌─────────────────────────────────────────────┐
│ Divido                         Profile/Menu │
├─────────────────────────────────────────────┤
│ October 2026                         [Month]│
│ Welcome back                                 │
│                                             │
│ Planned income       Recorded income         │
│ LKR XX,XXX           LKR XX,XXX              │
│                                             │
│ Monthly savings target                       │
│ LKR XX,XXX                                   │
│                                             │
│ Group budget overview                        │
│ Needs       spent / planned   remaining      │
│ Wants       spent / planned   remaining      │
│ Culture     spent / planned   remaining      │
│ Unexpected  spent / planned   remaining      │
│                                             │
│ [ + Add expense ] [ + Add income ]           │
│                                             │
│ Recent transactions                          │
│ Date | Description/category | Amount         │
│ [View all transactions]                      │
│                                             │
│ Insight / monthly reflection entry point     │
└─────────────────────────────────────────────┘
```

**Rules:** Every amount must be labeled as planned or actual. If no plan exists, show a setup CTA rather than empty budget totals. Month selector behavior and historical-month support require approval.

## 2. Add expense

```text
┌────────────────────────────────────┐
│ ← Back        Add expense          │
├────────────────────────────────────┤
│ Amount *                           │
│ [ LKR __________________ ]         │
│                                    │
│ Category *                         │
│ [ Choose a category           v ]  │
│ Group explanation (based on group) │
│                                    │
│ Date                               │
│ [ Today                       v ]  │
│                                    │
│ Description (optional)             │
│ [ ____________________________ ]  │
│                                    │
│ Payment method (optional)          │
│ [ Choose method               v ]  │
│                                    │
│ [ Save expense ]                   │
└────────────────────────────────────┘
```

**Validation:** Required fields are identified in text; errors appear beside the field and in an announced summary if needed. Do not clear valid fields after a recoverable failure.

## 3. Transactions list

```text
┌────────────────────────────────────────────┐
│ Transactions                 [+ Add]        │
├────────────────────────────────────────────┤
│ [Month/date range] [Type] [Category]        │
│ [Search description, if supported]          │
│                                            │
│ October 12                                  │
│ Groceries / Needs                - LKR 2,400│
│ October 11                                  │
│ Salary / Income                  + LKR 85,000│
│                                            │
│ [Load more / pagination]                    │
└────────────────────────────────────────────┘
```

Use clear signs and labels for income versus expense. Filters must be usable without a mouse. Avoid a wide spreadsheet-style table on mobile.

## 4. Budget

```text
┌────────────────────────────────────────────┐
│ Monthly budget                 [Month v]     │
├────────────────────────────────────────────┤
│ Planned income                 LKR XX,XXX    │
│ Savings target                 LKR XX,XXX    │
│ Planned group allocations      LKR XX,XXX    │
│ Unallocated / over plan        LKR XX,XXX    │
│                                            │
│ Needs       [amount]  spent / remaining     │
│ Wants       [amount]  spent / remaining     │
│ Culture     [amount]  spent / remaining     │
│ Unexpected  [amount]  spent / remaining     │
│                                            │
│ [Save plan]                                 │
└────────────────────────────────────────────┘
```

The meaning of “unallocated” and the exact calculation need business-rule approval. Warn clearly when planned allocations plus savings target exceed planned income.

## 5. Insights

```text
┌────────────────────────────────────────────┐
│ Insights                    [Last 90 days]  │
├────────────────────────────────────────────┤
│ Your patterns                               │
│ [Observation headline]                      │
│ What we noticed and the period used         │
│ Why this may matter                         │
│                                            │
│ [Another observation, if supported]         │
│                                            │
│ Not enough data?                            │
│ Explain the minimum activity needed         │
└────────────────────────────────────────────┘
```

Avoid false precision, causal claims, and shame-based language. Show the lookback period and distinguish an observation from a recommendation.

## 6. Monthly reflection

```text
┌────────────────────────────────────────────┐
│ Reflect on October                          │
├────────────────────────────────────────────┤
│ What went well with your money this month?  │
│ [______________________________________]    │
│                                            │
│ What felt difficult or surprising?          │
│ [______________________________________]    │
│                                            │
│ What would you like to change next month?    │
│ [______________________________________]    │
│                                            │
│ [Save reflection] [Skip for now]            │
└────────────────────────────────────────────┘
```

These are sample questions only. Product owner approval is required before implementation. Reflection should be optional and non-judgmental.

## 7. Onboarding plan review

```text
┌────────────────────────────────────────────┐
│ Your monthly plan                            │
├────────────────────────────────────────────┤
│ Planned income                LKR XX,XXX     │
│ Savings target                LKR XX,XXX     │
│ Needs                         LKR XX,XXX     │
│ Wants                         LKR XX,XXX     │
│ Culture                       LKR XX,XXX     │
│ Unexpected                    LKR XX,XXX     │
│                                            │
│ [Warning if total exceeds income]            │
│ [Edit plan]                  [Finish setup]  │
└────────────────────────────────────────────┘
```

Whether users may finish with an over-allocated plan is a product decision; the UI must match the approved rule.

## 8. Required states for every screen

Document and implement:
- Initial loading
- Refreshing, where relevant
- Empty state
- Field validation errors
- API/network failure
- Unauthorized/session expired
- Not found or unavailable record
- Success confirmation
- Disabled/loading submit action to prevent accidental duplicate submission
- Responsive narrow-screen layout
