# Divido — UI Architecture, Design System & Implementation Guide

**Status:** ACTIVE — Canonical Frontend & UI Reference  
**Framework:** Next.js (App Router, Turbopack) & React 19  
**Styling Architecture:** Pure Modular CSS (`figma-styles.css`, `design-system.css`, `app.css`)  
**Design System Origin:** Custom Figma Dark/Light Design Prototype  

---

## 🎨 1. Design Vision & Principles

Divido's UI is designed to make personal finance calm, deliberate, and visually engaging. It transitions traditional budgeting from rigid spreadsheets into an intuitive, tactile experience.

### Core Principles
1. **Honest & Direct Feedback:** No hidden math. All formulas, totals, and group allocations reflect live server state.
2. **Warn, Never Block (DEC-012):** When a user allocates more than their planned income, the UI warns with clear visual cues rather than forbidding them from saving.
3. **Visual Hierarchy through Contrast & Color:**
   * **Inflow / Income:** Emerald Green (`--green: #059669`) represents incoming money and positive milestones.
   * **Outflow / Expense:** Vibrant Red / Crimson (`--danger: #ef4444` / `#dc2626`) clearly demarcates spending and destructive actions.
   * **Budget Groups:** Semantic, soft accent colors for four core groups: **Needs**, **Wants**, **Culture**, and **Unexpected**.
4. **Clean Modern Terminology:** Completely purged legacy jargon (e.g. "Kakeibo Method") in favor of universal personal finance terms ("Personal Budgeting", "Budget Groups", "Spending Insights").
5. **Real-API Driven:** No mock data or `localStorage` fallbacks. Every screen communicates directly with the Spring Boot REST backend with robust loading, error, and retry states.

---

## 📐 2. Color Palette & Typography Tokens

The design system supports both **Dark Mode (Default)** and **Light Mode**, driven by CSS custom properties attached to `:root` and `[data-theme='dark']`.

### Color Tokens

| Token | Dark Theme (Default) | Light Theme | Usage |
|---|---|---|---|
| `--page` | `#0b0f0d` (Deep Obsidian) | `#ffffff` | Background of the application page |
| `--white` | `#151a17` (Subtle Surface) | `#ffffff` | Card surfaces, modals, popovers |
| `--ink` | `#f2f5f3` (Crisp Off-White) | `#0b0f0d` | Primary headings, body copy |
| `--muted` | `#abb2ac` (Slate Grey) | `#0b0f0d99` | Secondary text, labels, timestamps |
| `--line` | `#ffffff1a` (Subtle Border) | `#0b0f0d14` | Card borders, dividers, table rows |
| `--green` | `#059669` (Emerald) | `#059669` | Primary actions, recorded income, savings targets |
| `--danger` | `#ef4444` (Vibrant Red) | `#dc2626` | Add Expense button, recorded expenses, delete flows |
| `--surface-subdued` | `#191e1a` | `#f8faf9` | Tag pills, badge backgrounds, input fills |

### Typography: Inter Font Family
* **Scale:**
  * Page Title (`h1`): `29px` – `32px` (`font-weight: 600`, `letter-spacing: -1.1px`)
  * Section Title (`h2`): `17px` (`font-weight: 600`, `letter-spacing: -0.45px`)
  * Card Header / Eyebrow: `8px` – `10px` (`letter-spacing: 1.7px`, uppercase, `font-weight: 600`)
  * Body Text: `13px` – `14px` (`font-weight: 450` / `500`)
  * Tabular Numbers: `font-variant-numeric: tabular-nums` for all financial figures.

---

## 🏗️ 3. Navigation & App Shell Structure

All authenticated pages are wrapped in a unified layout (`AppShell.tsx` & `AppShellContext.tsx`) that provides consistent navigation and global modal management.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ AppShell                                                               │
│ ┌───────────────┬────────────────────────────────────────────────────┐ │
│ │ Sidebar       │ TopBar (Breadcrumbs, Month Stepper, User, Theme)   │ │
│ │ (Desktop)     ├────────────────────────────────────────────────────┤ │
│ │               │ PageHeading (Title, Period Tag, Action Buttons)    │ │
│ │ • Dashboard   ├────────────────────────────────────────────────────┤ │
│ │ • Transactions│ Main Page Content                                 │ │
│ │ • Budget      │ (DashboardCards, BudgetPlanner, InsightCharts, etc)│ │
│ │ • Insights    │                                                    │ │
│ │ • Reflection  │                                                    │ │
│ │ • Settings    ├────────────────────────────────────────────────────┤ │
│ │               │ MobileDock (Bottom Floating Nav on screens < 768px)│ │
│ └───────────────┴────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Persistent Sidebar (Desktop)
* Displays the Divido brand logo (`<Brand variant="full" />`).
* Direct links to all primary sections with active indicator pills and Lucide icons.
* Collapsible state with quick user card and sign-out dialog trigger at the footer.

### 2. Top Bar
* Dynamic route breadcrumb (`/ Dashboard`, `/ Transactions`, etc.).
* Light/Dark mode toggle button.
* User avatar showing the initials of the signed-in user.

### 3. Floating Mobile Dock (`MobileDock.tsx`)
* Fixed bottom navigation dock designed for one-handed mobile use.
* Center prominent circular action button (`+`) that summons the quick-add transaction modal.
* Fully centered layout preventing clipping on iOS Safari and mobile Chrome.

---

## 📱 4. Page-by-Page Detailed UI Breakdown

### 1. Dashboard (`/dashboard`)
* **Header Actions:**
  * Month Selector: Step backward/forward or jump to any month in `YYYY-MM`.
  * **`+ Add expense` Button:** Styled in **Vibrant Red** (`button-destructive`), instantly opening the expense modal.
  * **`+ Add income` Button:** Styled in **Emerald Green** (`button-primary`), opening the income modal.
* **Summary Cards (4-Column Grid on Desktop, 2-Column on Mobile):**
  1. *Planned Income:* Target income from the monthly budget plan.
  2. *Recorded Income:* Actual income recorded via income transactions.
  3. *Spent This Month:* Total recorded outflow with live delta against group budgets.
  4. *Savings Target:* Planned savings amount with visual achievement indicator.
* **Fresh Month Notice (`FreshMonthNotice.tsx`):**
  * Displays an encouraging prompt (`Sparkles` icon) when entering a new calendar month with no recorded activity.
* **Group Breakdown Section:**
  * Visual progress bars for Needs, Wants, Culture, and Unexpected.
  * Shows percentage consumed, amount remaining, and overspent badges when expenses exceed group budgets.
* **Recent Transactions List:**
  * Quick-look list of the latest 5 transactions with date, category icon, and formatted amounts.

---

### 2. Budget Management (`/budget`)
* **Monthly Planning Sheet:**
  * Inputs for *Planned Income* and *Savings Target*.
* **Group Budget Cards:**
  * Individual allocation controls for the 4 core groups:
    * **Needs:** Essential living expenses (Rent, Groceries, Utilities).
    * **Wants:** Discretionary lifestyle spending (Dining out, Shopping).
    * **Culture:** Books, education, events, experiences.
    * **Unexpected:** Emergency expenses, repairs, unbudgeted needs.
* **Live Calculation Bar (`BudgetTotals` & `BudgetSaveBar`):**
  * Floating summary computing `Allocated = Needs + Wants + Culture + Unexpected + Savings Target`.
  * **Over-allocation Warning:** If allocations exceed Planned Income, turns amber with descriptive warning text without disabling the "Save budget" button.

---

### 3. Transactions Management (`/transactions`)
* **Summary Strip:** Displays total transaction count for the current month.
* **Filter Bar (`TransactionFilters.tsx`):**
  * Type filter toggle pills: `All`, `Expenses`, `Income`.
  * Group dropdown filter: Filter by Need, Want, Culture, Unexpected.
  * Dynamic Category & Income Source selectors.
  * "Clear filters" button with instant reset.
* **Transaction Table / Cards (`TransactionRows.tsx`):**
  * Date headers grouping entries chronologically.
  * Category badge with group color coding.
  * Expense amounts formatted in red with a minus (`- LKR 200.00`).
  * Income amounts formatted in green with a plus (`+ LKR 5,000.00`).
  * Click any row to open the full edit/view detail dialog.

---

### 4. Spending Insights (`/insights`)
* **Eligibility Banner:** Requires a minimum of 3 days of recorded spending in the month to show statistical patterns.
* **Visual Charts:**
  * **Spending Trend Chart (`SpendingTrendChart.tsx`):** Interactive SVG area chart charting cumulative spending trajectory over the last 6 months.
  * **Group Share Chart (`GroupShareChart.tsx`):** Circular doughnut visualization comparing proportional group spending against targets.
* **Observation Cards (`ObservationCard.tsx`):**
  * Highlight cards highlighting factual observations:
    * *Top Category:* Highlights the largest single expense category.
    * *Spending Velocity:* Pacing of daily spending compared to the prior month.
    * *Savings Trajectory:* Probability of meeting the monthly savings target.

---

### 5. Monthly Reflection (`/reflection`)
* **Reflection Prompt Deck:**
  * 3 thoughtful, reflective prompts for reviewing the past financial month:
    1. *What went well with your spending this month?*
    2. *Where did unexpected expenses occur?*
    3. *What changes do you plan for next month?*
* **Interactive Features:**
  * Live character counters with visual limit indicator.
  * Optimistic locking and conflict banner: If modified concurrently, informs user before overwriting.
  * Reflection History: Drawer displaying past saved reflection answers.

---

### 6. Categories Management (`/categories`)
* **Group Filter Tabs:** Filter custom categories by Needs, Wants, Culture, or Unexpected.
* **Global Default Categories:**
  * Pre-seeded defaults (Groceries, Transport, Entertainment) visually tagged with a "Default" badge and locked against accidental deletion.
* **Custom Category Management:**
  * Modal dialog to create or rename categories, change assigned groups, or deactivate categories.

---

### 7. Income Sources Management (`/income-sources`)
* **Source Cards:** Shows source name, creation date, and active/inactive status.
* **"Show Inactive" Switch:** Toggle visibility of deactivated income sources.
* **Inline Modals:** Create new income sources or safely deactivate existing sources with confirmation.

---

### 8. Settings & Account Lifecycle (`/settings`)
* **Profile Form:** Update public Display Name with instantaneous update across the top bar.
* **Password Management:** Change password with mandatory current password validation; triggers session invalidation across other devices.
* **Danger Zone:**
  * Distinct red outlined panel for permanently deleting the user account and cascading all financial data.

---

### 9. Guided Onboarding (`/onboarding`)
* **3-Step Wizard for New Accounts:**
  1. *Welcome Step:* Introduces the 4-group budgeting framework.
  2. *First Budget Step:* Quick inputs to set this month's planned income and savings goal.
  3. *All Set Step:* Direct route to Dashboard with confetti guidance.
* Every step is skippable, ensuring immediate access to the app without forced roadblocks.

---

### 10. Authentication Suite (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`)
* Clean centered authentication card layout.
* Floating label input fields with instant validation error text.
* Automatic CSRF token synchronization with backend security filters.
* Single-use password reset link flow with instant status feedback.

---

## 🧩 5. Reusable Component Inventory

| Component | File Path | Key Features & Props |
|---|---|---|
| **Button** | `frontend/components/ui/Button.tsx` | Variants: `primary` (Green), `destructive` (Red), `secondary`, `ghost`, `dark`. Supports `loading` spinner. |
| **PageHeading** | `frontend/components/layout/PageHeading.tsx` | Standardizes page titles, subtitle text, eyebrow tags, and desktop action button slots. |
| **Money** | `frontend/components/financial/Money.tsx` | Tabular numeric rendering, currency prefix (`LKR`), decimal alignment. |
| **MoneyField** | `frontend/components/forms/MoneyField.tsx` | Specialized input for currency amounts with input mask and prefix symbol. |
| **GroupBadge** | `frontend/components/financial/GroupBadge.tsx` | Semantic tag badges for `NEEDS`, `WANTS`, `CULTURE`, and `UNEXPECTED`. |
| **MonthSelector** | `frontend/components/financial/MonthSelector.tsx` | Accessible dropdown and arrow buttons for navigating months in `YYYY-MM`. |
| **Modal** | `frontend/components/ui/Modal.tsx` | Accessible dialog with overlay backdrop blur, Esc key listeners, and focus traps. |
| **ConfirmDialog** | `frontend/components/feedback/ConfirmDialog.tsx` | Reusable modal for destructive confirmations (delete transaction, deactivate source). |
| **InlineError** | `frontend/components/feedback/InlineError.tsx` | Accessible alert box with retry button for server failure states. |
| **LoadingPanel** | `frontend/components/feedback/LoadingPanel.tsx` | Skeleton loading panel with animated pulsing bars. |
| **Toast** | `frontend/components/layout/Toast.tsx` | Global animated notification toasts for success, info, and error notifications. |

---

## 📱 6. Mobile & Responsive Design Standards

Divido adheres to strict responsive guidelines ensuring zero horizontal overflow on small devices:
1. **Viewport Verification:** Tested at `375px` (iPhone SE/Mini) up to `4K` displays.
2. **Touch Targets:** All interactive buttons and inputs maintain a minimum touch target of `44px` height.
3. **Adaptive Grids:**
   * Desktop: 4-column overview grid (`repeat(4, minmax(0, 1fr))`).
   * Tablet: 2-column overview grid.
   * Mobile: Single-column stacked cards with fluid width.
4. **Dock Offset:** Main page content includes `padding-bottom: 90px` on mobile viewports so content is never obscured by the floating bottom dock.

---

## ⚡ 7. State Management & API Layer

* **Server State Synchronization:**
  * Uses the custom hook `useApiData` for handling fetch lifecycle: `loading`, `error`, `ready`.
  * Automatic retry mechanisms on network drops or intermittent 5xx errors.
* **AppShell Context (`useAppShell`):**
  * Maintains `dataVersion` timestamp counter. Mutating operations (e.g. adding an expense or updating a budget) increment `dataVersion`, triggering an automatic silent refresh across all active page queries.
* **Modal Orchestration:**
  * Global dialogs (`QuickAddDialog`, `TransactionFormDialog`, `DeleteTransactionDialog`) are mounted at the layout level in `AppShell`, preventing nested re-renders and modal stacking issues.
