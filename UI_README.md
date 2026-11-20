# Divido — Complete UI Architecture, Tabs, Sections & Design Specification

**Status:** ACTIVE — Canonical Frontend & User Interface Reference  
**Application:** Divido Personal Budgeting System  
**Framework:** Next.js (App Router, Turbopack) & React 19  
**Styling Architecture:** Pure Modular CSS (`figma-styles.css`, `design-system.css`, `app.css`, `page-transition.css`)  
**Design Foundations:** Custom Figma Dark/Light Design System & Kakeibo 4-Pillar Budgeting Architecture  

---

## 📑 Table of Contents

1. [Executive Summary & Design Vision](#1-executive-summary--design-vision)
2. [Design System & Visual Tokens](#2-design-system--visual-tokens)
3. [Global Navigation & Application Shell](#3-global-navigation--application-shell)
   - [3.1 Desktop Collapsible Sidebar](#31-desktop-collapsible-sidebar)
   - [3.2 Top Bar Navigation & Quick Menu](#32-top-bar-navigation--quick-menu)
   - [3.3 Raised Floating Mobile Navigation Bar](#33-raised-floating-mobile-navigation-bar)
   - [3.4 Native Vertical Upward-Swipe Page Transition](#34-native-vertical-upward-swipe-page-transition)
4. [Authentication & Public Onboarding Suite](#4-authentication--public-onboarding-suite)
   - [4.1 Sign In (`/sign-in`)](#41-sign-in-sign-in)
   - [4.2 Sign Up / Registration (`/sign-up`)](#42-sign-up--registration-sign-up)
   - [4.3 Forgot Password (`/forgot-password`)](#43-forgot-password-forgot-password)
   - [4.4 Reset Password (`/reset-password`)](#44-reset-password-reset-password)
   - [4.5 Guided Onboarding Wizard (`/onboarding`)](#45-guided-onboarding-wizard-onboarding)
5. [Authenticated App Pages & Tab Sections](#5-authenticated-app-pages--tab-sections)
   - [5.1 Overview / Dashboard (`/dashboard`)](#51-overview--dashboard-dashboard)
   - [5.2 History / Transactions Management (`/transactions`)](#52-history--transactions-management-transactions)
   - [5.3 Budget Planning (`/budget`)](#53-budget-planning-budget)
   - [5.4 Spending Insights (`/insights`)](#54-spending-insights-insights)
   - [5.5 Monthly Reflection (`/reflection`)](#55-monthly-reflection-reflection)
   - [5.6 Categories Management (`/categories`)](#56-categories-management-categories)
   - [5.7 Income Sources Management (`/income-sources`)](#57-income-sources-management-income-sources)
   - [5.8 Profile & Settings (`/settings`)](#58-profile--settings-settings)
6. [Bottom-Sheet Transaction Flow & Mobile Touch Gestures](#6-bottom-sheet-transaction-flow--mobile-touch-gestures)
   - [6.1 Quick Add & Multi-step Workflow](#61-quick-add--multi-step-workflow)
   - [6.2 Touch Gesture Minimization & Expansion](#62-touch-gesture-minimization--expansion)
7. [Mobile Viewport Standards, Anti-Zoom & Accessibility](#7-mobile-viewport-standards-anti-zoom--accessibility)
8. [Technical Component Inventory & State Architecture](#8-technical-component-inventory--state-architecture)

---

## 🎨 1. Executive Summary & Design Vision

Divido is engineered to make personal finance calm, deliberate, tactile, and mathematically honest. It eliminates spreadsheet fatigue by organizing all cash flow into intuitive monthly periods and four universal financial categories: **Needs**, **Wants**, **Culture**, and **Unexpected**.

### Core Product Tenets
1. **Mathematical Honesty:** No synthetic math or hidden numbers. Every balance and total reflects real server-side state.
2. **Warn, Never Block (DEC-012):** When planned spending exceeds planned income, the user receives an alert with amber indicators, but the application never blocks them from saving their plan.
3. **High-Contrast Semantic Color Language:**
   * **Inflow / Positive:** Divido Emerald Green (`#10b981` / `#16a34a`) denotes income, savings progress, and primary actions.
   * **Outflow / Negative:** Crimson Red (`#ef4444` / `#dc2626`) denotes recorded expenses and destructive actions.
   * **Budget Groups:** Distinct semantic badges and icons for Needs, Wants, Culture, and Unexpected.
4. **Zero Layout Shifts & Native Fluidity:** Built with hardware-accelerated transforms (`translate3d`), responsive font clamping, and native CSS transitions without heavy third-party animation libraries.

---

## 📐 2. Design System & Visual Tokens

Divido features a dual-theme token architecture powered by CSS custom properties on `:root` and `[data-theme='dark']`. **Dark Mode is the default experience.**

### Color Palette Tokens

| Token Name | Dark Theme (Default) | Light Theme | Visual Role / Purpose |
|---|---|---|---|
| `--page` | `#0b0e0c` (Obsidian Void) | `#ffffff` (Pure White) | Global canvas and root viewport background |
| `--white` | `#111512` (Card Surface) | `#ffffff` | Primary container cards, modals, and dropdowns |
| `--surface-secondary` | `#151b17` (Subdued Surface) | `#f8faf9` | Tag badges, secondary buttons, input backgrounds |
| `--surface-elevated` | `#1a211c` (Elevated Surface) | `#f0f3f1` | Floating bottom navigation dock, popovers |
| `--ink` | `#f2f5f3` (Crisp Off-White) | `#0b0f0d` (Deep Charcoal) | Primary headlines, body text, strong numbers |
| `--muted` | `#a5aea7` (Slate Grey) | `#64748b` (Muted Slate) | Secondary labels, descriptions, timestamps |
| `--faint` | `#747f77` (Muted Faint) | `#94a3b8` | Disabled indicators, placeholder copy |
| `--line` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Hairline borders, dividers, table row lines |
| `--soft` | `rgba(255, 255, 255, 0.035)` | `rgba(0, 0, 0, 0.035)` | Ghost button hover states, row highlight |
| `--green` | `#10b981` / `#16a34a` (Divido Green) | `#16a34a` | Primary actions, income amounts, positive progress |
| `--green-accent`| `#4ade80` (Mint Glow) | `#15803d` | Halo aura on active navigation tabs, balance cards |
| `--danger` | `#ef4444` (Vibrant Red) | `#dc2626` | Add expense buttons, expense values, delete alerts |
| `--warning` | `#f59e0b` (Amber Alert) | `#d97706` | Budget over-allocation warnings (DEC-012) |

### Typography Tokens (Geist & Inter Scale)
* **Page Headline (`h1`):** `clamp(24px, 5vw, 32px)`, `font-weight: 600`, `letter-spacing: -1px`
* **Section Headline (`h2`):** `clamp(16px, 3.5vw, 20px)`, `font-weight: 650`, `letter-spacing: -0.4px`
* **Eyebrow / Category Tag:** `9px` – `11px`, `letter-spacing: 1.5px`, uppercase, `font-weight: 650`
* **Body Text:** `13px` – `14px`, `font-weight: 450` / `500`, `line-height: 1.6`
* **Tabular Financial Numbers:** Rendered with `font-variant-numeric: tabular-nums` to guarantee aligned columns and decimal precision.

---

## 🏗️ 3. Global Navigation & Application Shell

All authenticated user experiences are wrapped inside `AppShell.tsx`, which unifies top bar controls, navigation drawers, floating mobile docks, and global dialog orchestration.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ AppShell Layout                                                        │
│ ┌───────────────┬────────────────────────────────────────────────────┐ │
│ │ Desktop       │ TopBar (Breadcrumbs, Month Stepper, Theme, Avatar) │ │
│ │ Sidebar       ├────────────────────────────────────────────────────┤ │
│ │ (Collapsible) │ PageHeading (Title, Period Tag, Action Buttons)    │ │
│ │               ├────────────────────────────────────────────────────┤ │
│ │ • Overview    │ Main Scrollable Content                            │ │
│ │ • History     │ (Dashboard, Transactions, Budget, Insights, etc.)  │ │
│ │ • Budget      │                                                    │ │
│ │ • Insights    │                                                    │ │
│ │ • Reflection  ├────────────────────────────────────────────────────┤ │
│ │ • Settings    │ Raised Floating Mobile Dock (Screens < 768px)      │ │
│ └───────────────┴────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Desktop Collapsible Sidebar
* **Brand Area:** Divido dual-leaf logo with responsive light/dark asset swapping (`Brand.tsx`).
* **Navigation Links:**
  * **MAIN SECTION:**
    * **Overview** (`/dashboard`): Dashboard icon, links to monthly cash flow overview.
    * **History** (`/transactions`): ArrowLeftRight icon, links to full transaction ledger.
    * **Budget** (`/budget`): Wallet icon, links to monthly planning sheet.
    * **Insights** (`/insights`): Chart icon, links to spending trend analytics.
  * **PERSONAL SECTION:**
    * **Monthly reflection** (`/reflection`): Leaf icon, links to end-of-month review.
    * **Settings** (`/settings`): Cog icon, links to account and preferences.
* **Collapsible State:** A persistent toggle button allows collapsing the sidebar from `226px` to a slim `72px` icon bar. The preference is remembered in `localStorage` (`divido-sidebar-collapsed`).
* **Footer Profile Card:** Displays the user's name, initials avatar, and a sign-out button that opens the confirmation dialog.

### 3.2 Top Bar Navigation & Quick Menu
* **Route Breadcrumbs:** Clean path rendering (e.g., `Divido / Dashboard`).
* **Theme Switcher:** Single-click toggle between Dark and Light visual themes.
* **User Profile Avatar & Menu:** Circular 34px avatar displaying user initials. Clicking reveals a dropdown menu:
  * User display name and registered email address.
  * Quick link to **Settings & preferences**.
  * Quick link to **Monthly reflection**.
  * Quick link to **Help & instructions**.
  * **Sign out** button triggering the session invalidation dialog.

### 3.3 Raised Floating Mobile Navigation Bar (`MobileDock.tsx`)
Designed exclusively for phone screens (`< 768px`) with ergonomic one-handed operation:
* **Container:** Symmetrical floating pill container with liquid glass blur (`backdrop-filter: blur(24px)`), hairline border, and 12px outer screen margins.
* **Four Destination Tabs:**
  1. **Overview** (`/dashboard`)
  2. **History** (`/transactions`)
  3. **Budget** (`/budget`)
  4. **Insights** (`/insights`)
* **Elevated Halo Bubble (Active Indicator):** The currently active tab physically rises **13px above the navigation bar** inside a glowing circular bubble featuring a radial mint/emerald gradient, white border, and luminous green shadow.
* **Central Raised Plus (+) Action:** Centered elevated round button (`50px × 50px`) with emerald gradient and white plus icon. Tapping opens the Transaction Modal directly on the current screen without navigating away.

### 3.4 Native Vertical Upward-Swipe Page Transition
* **Zero Fake Loaders:** Completely removed simulated percentage counters, fake progress bars, and arbitrary delays.
* **Veil Curtain Layer (`PageTransitionOverlay.tsx`):** Displays a deep obsidian curtain (`#060807`) with ambient emerald glow and a gently pulsing Divido brand logo while destination page data loads behind the curtain.
* **Readiness Coordination:** Uses `MutationObserver` on the target DOM container to detect when real data and components have finished mounting.
* **Cinematic Upward Swipe:** As soon as the destination page is ready, it slides into view from the bottom (`translate3d(0, 100%, 0) -> translate3d(0, 0, 0)`) over 380ms using a smooth cubic-bezier easing curve (`0.16, 1, 0.3, 1`).

---

## 🔐 4. Authentication & Public Onboarding Suite

The authentication system is backed by secure HTTP-only cookies, automated CSRF header injection, and server-side rate limiting.

### 4.1 Sign In (`/sign-in`)
* **Visual Composition:** Centered card with Divido branding and clean vertical inputs.
* **Inputs:** Email address, password field with visibility toggle.
* **Actions:**
  * Primary "Sign in" button with loading spinner state.
  * Link to `/forgot-password` ("Forgot your password?").
  * Link to `/sign-up` ("Don't have an account? Create one").
* **Security & Error Handling:** Generic credentials error messaging preventing user enumeration.

### 4.2 Sign Up / Registration (`/sign-up`)
* **Inputs:** Full Name, Email Address, Password, Password Confirmation.
* **Client-Side Validation:** Enforces 8-character minimum, 72-byte maximum (Bcrypt safe boundary), and match verification before dispatching network requests.
* **Success Journey (DEC-025):** Successfully registered users receive an encouraging confirmation and are routed to `/sign-in` to authenticate cleanly.

### 4.3 Forgot Password (`/forgot-password`)
* **Inputs:** Registered email address.
* **Behavior:** Dispatches a single-use token to the user via background mailer.
* **Privacy Baseline:** Displays a neutral success confirmation ("If an account exists, a reset link was sent") to prevent email probing.

### 4.4 Reset Password (`/reset-password`)
* **Token Verification:** Reads reset token from URL parameters (`?token=...`).
* **Inputs:** New password, confirm new password.
* **Outcome:** Single-use token invalidation, password update in database, and immediate redirection to sign-in.

### 4.5 Guided Onboarding Wizard (`/onboarding`)
* **Progress Bar:** Top progress line indicating the current step (1 of 3).
* **Step 1 — Welcome:** Introduces Divido's 4-group budgeting framework (Needs, Wants, Culture, Unexpected).
* **Step 2 — First Budget:** Quick setup inputs to configure the current month's **Planned Income** and **Savings Target**.
* **Step 3 — Ready to Go:** Final confirmation summarizing the initial setup with an instant jump to the Dashboard.
* **Skip Action:** Every step includes a "Skip for now" link for instant access to the application.

---

## 📊 5. Authenticated App Pages & Tab Sections

### 5.1 Overview / Dashboard (`/dashboard`)
The central command center for personal cash flow during the selected month.

```text
┌─────────────────────────────────────────────────────────────┐
│ Welcome back, {Name}                  < November 2026 >    │
├─────────────────────────────────────────────────────────────┤
│ AVAILABLE BALANCE                              [Wallet Icon]│
│ LKR 45,000.00                                               │
│ Your remaining money this month                             │
│ ─────────────────────────────────────────────────────────── │
│ Income – Expenses                               60,000 – 15,000│
├──────────────────────────────┬──────────────────────────────┤
│ ↗ Total Income              │ ↘ Total Expenses             │
│ LKR 60,000.00                │ LKR 15,000.00                │
├──────────────────────────────┴──────────────────────────────┤
│ Group breakdown (November 2026)             Manage plan ↗   │
│ ┌───────────────────────────┬─────────────────────────────┐ │
│ │ ⌂ Needs        LKR 10,000 │ ♡ Wants           LKR 3,000 │ │
│ │ [████████░░░] 60% spent   │ [████░░░░░░] 30% spent      │ │
│ ├───────────────────────────┼─────────────────────────────┤ │
│ │ 🕮 Culture       LKR 1,000 │ 🔧 Unexpected     LKR 1,000 │ │
│ │ [██░░░░░░░░] 10% spent   │ [██░░░░░░░░] 10% spent      │ │
│ └───────────────────────────┴─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Recent transactions                                         │
│ • Groceries (Keells)            Need            - LKR 4,200 │
│ • Monthly Salary                Salary         + LKR 60,000 │
└─────────────────────────────────────────────────────────────┘
```

1. **Header Area:**
   - Greeting headline ("Welcome back, {Name}") with responsive text clamping.
   - Month Stepper Control (`< November 2026 >`) allowing rapid month switching.
   - Desktop Quick Action Buttons: Red `+ Add expense` and Green `+ Add income`.
2. **Hero Card — Available Balance (`.available-balance-card`):**
   - Deep emerald forest gradient surface with subtle border aura.
   - Eyebrow with wallet icon and `AVAILABLE BALANCE`.
   - Massive tabular balance display (`LKR {amount}`) styled with `font-size: clamp(24px, 7.5vw, 34px)`.
   - Formula row: `Income − Expenses` displaying exact real numbers.
3. **Stats Grid — Total Income & Total Expenses:**
   - Symmetrical 2-column card grid on both mobile and desktop.
   - **Total Income:** Upward green arrow, label, and bold total.
   - **Total Expenses:** Downward coral arrow, label, and bold total.
4. **Group Breakdown (Card-by-Card):**
   - Header with period tag and a direct link to `Manage plan ↗` (`/budget`).
   - 4 independent cards for **Needs**, **Wants**, **Culture**, and **Unexpected**.
   - Each card displays: icon with subtle container, group title with link arrow, spent amount in bold (`LKR X spent`), planned budget (`of LKR Y planned`), custom progress track, remaining balance (`LKR Z left`), and percentage used.
   - 2-column grid on desktop, 1-column stacked on mobile.
5. **Recent Transactions:**
   - Full-width container card displaying the 5 most recent records.
   - Row elements: Icon, category/source, description, date, and tabular amount.
   - Footer link: "View all transactions ↗" routing directly to `/transactions`.
6. **Fresh Month Notice:**
   - Displayed when viewing a month with zero recorded transactions to encourage the user to log their first entry.

---

### 5.2 History / Transactions Management (`/transactions`)
The complete ledger and audit trail of all financial movements.

1. **Transaction Summary Strip:** Displays total transaction count for the active month.
2. **Segmented Type Switcher:** Quick filter pills: `All`, `Expenses`, `Income`.
3. **Filter & Search Bar (`TransactionFilters.tsx`):**
   - Live search input: Filter by merchant name or description.
   - Group selector: Filter specifically by Needs, Wants, Culture, or Unexpected.
   - Category selector: Filter by assigned expense category.
   - Income Source selector: Filter by income source.
   - "Clear filters" button for instant reset.
4. **Chronological Transaction Ledger (`TransactionRows.tsx`):**
   - Grouped under clean date dividers (`Today`, `Yesterday`, or formatted date).
   - Each entry shows: Icon, description, category badge, group tag, and tabular currency.
   - Inflow formatted in green with plus (`+ LKR 50,000.00`).
   - Outflow formatted in red with minus (`- LKR 1,500.00`).
5. **Transaction Detail Dialog (`TransactionDetailDialog.tsx`):**
   - Clicking any transaction row opens its inspection sheet.
   - Shows creation date, payment method, category, group, and optional notes.
   - Provides **Edit** button (opens form sheet) and **Delete** button (opens confirmation).
6. **Pagination Controls:** Next/Previous buttons for browsing transaction history.

---

### 5.3 Budget Planning (`/budget`)
The planning center where users allocate money at the beginning of each month.

1. **Top Summary Sheet:**
   - Inputs for **Planned Income** and **Monthly Savings Target**.
2. **Four Group Allocation Cards:**
   - Individual budget allocation boxes for **Needs**, **Wants**, **Culture**, and **Unexpected**.
   - Lists all active categories currently mapped to each group.
   - Sliders and numeric money inputs for adjusting allocations.
3. **Sticky Calculation & Save Bar (`BudgetSaveBar.tsx`):**
   - Computes total allocated money: `Allocated = Needs + Wants + Culture + Unexpected + Savings Target`.
   - Computes unallocated money remaining from planned income.
   - **Over-allocation Warning (DEC-012):** If allocated money exceeds planned income, turns amber with a helpful explanatory warning, but keeps the "Save budget" button enabled.
   - "Save budget" action button with live server persistence and feedback toast.

---

### 5.4 Spending Insights (`/insights`)
Automated data visualization and behavioral observations.

1. **Eligibility Threshold:** Requires at least 3 days of recorded spending in the active month; otherwise shows an informative banner explaining that more data is needed.
2. **Spending Trend Area Chart (`SpendingTrendChart.tsx`):**
   - Interactive SVG line/area chart showing cumulative expenditure trajectory across the last 6 months.
   - Dashed reference line showing target budget trajectory.
3. **Group Share Doughnut Chart (`GroupShareChart.tsx`):**
   - Circular proportional breakdown showing percentage share of spending across Needs, Wants, Culture, and Unexpected.
4. **Behavioral Observation Cards (`ObservationCard.tsx`):**
   - **Top Category:** Highlights the single largest spending category of the month.
   - **Daily Pacing:** Compares spending speed (LKR/day) to the previous month.
   - **Savings Trajectory:** Projects likelihood of reaching the monthly savings target.

---

### 5.5 Monthly Reflection (`/reflection`)
A mindful end-of-month review tool inspired by traditional budgeting practices.

1. **Three Reflective Questions:**
   - *1. What went well with your spending this month?*
   - *2. Where did unexpected expenses occur?*
   - *3. What changes do you plan to make next month?*
2. **Interactive Form:**
   - Multi-line textareas with live character counters.
   - Save button with server-side validation.
3. **Conflict Detection:**
   - If edited concurrently from another tab or device, displays an optimistic locking alert to prevent accidental data overwrites.
4. **Reflection History Drawer:**
   - Browse past saved answers to review financial habits over time.

---

### 5.6 Categories Management (`/categories`)
Configures expense categories and their group mappings.

1. **Group Filter Tabs:** Filter category list by All, Needs, Wants, Culture, or Unexpected.
2. **System Default Categories:**
   - Pre-seeded global defaults (e.g., Groceries, Transport, Entertainment).
   - Displayed with a "Default" badge and locked against accidental deletion to preserve core functionality.
3. **Custom Category Management:**
   - Create new categories with custom names and assigned groups.
   - Rename or reassign existing categories.
   - Deactivate obsolete categories with safe referential integrity checks.

---

### 5.7 Income Sources Management (`/income-sources`)
Manages recurring and one-time income streams (Salary, Freelance, Dividends, etc.).

1. **Source Cards:** Displays source name, creation date, and active/inactive status.
2. **"Show Inactive" Switch:** Toggle visibility of deactivated income sources.
3. **Modal Dialogs:** Create new income sources, rename, or deactivate with confirmation.

---

### 5.8 Profile & Settings (`/settings`)
User preferences, security, and account lifecycle management.

1. **Profile Details:**
   - Edit user display name with instant header update upon saving.
2. **Security & Password:**
   - Change password form requiring verification of current password.
   - Invalidates all other active device sessions upon password change.
3. **Financial Preferences:**
   - Displays base currency (`LKR`) and standard 2-decimal formatting rules.
4. **Management Shortcuts:**
   - One-tap buttons to jump straight to `/categories` or `/income-sources`.
5. **Appearance:**
   - Radio buttons to toggle Dark Mode, Light Mode, or System Preference.
6. **Danger Zone:**
   - Red outlined container with an explicit confirmation dialog to permanently delete the user account and cascade-delete all associated transactions and budgets.

---

## 📱 6. Bottom-Sheet Transaction Flow & Mobile Touch Gestures

When a user taps the central Plus (`+`) button in the floating dock or clicks any "Add" action, Divido opens a mobile-optimized bottom sheet without navigating away from the current page.

```text
┌────────────────────────────────────────────────────────┐
│ [════════════════ Drag Handle Pill ════════════════]   │
│                                                        │
│ ← Record an expense                                 ✕  │
│                                                        │
│ Amount *                                               │
│ ┌────────────────────────────────────────────────────┐ │
│ │ LKR 0.00                                           │ │
│ └────────────────────────────────────────────────────┘ │
│ Category *                                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Choose a category                                ▼ │ │
│ └────────────────────────────────────────────────────┘ │
│ Date *                                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 11 / 20 / 2026                                   📅 │ │
│ └────────────────────────────────────────────────────┘ │
│ Description (Optional)                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ What was this expense for?                         │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ Cancel ]                       [ ✓ Save expense ]    │
└────────────────────────────────────────────────────────┘
```

### 6.1 Quick Add & Multi-step Workflow
1. **Step 1 — Choose Transaction Type (`QuickAddDialog.tsx`):**
   - Slides up from the bottom showing two touch targets:
     - **Add expense:** Coral/Red arrow row.
     - **Add income:** Emerald/Green arrow row.
2. **Step 2 — Transaction Form (`TransactionFormDialog.tsx`):**
   - Smoothly transitions on the same page.
   - Header contains a `< Back` button to return to Step 1 without closing the sheet.
   - Input fields: Amount (with tabular auto-formatting), Category dropdown, Date picker, Description, Payment Method.
   - Save button with loading spinner and automatic cache refresh.

### 6.2 Touch Gesture Minimization & Expansion
The bottom sheet (`Modal.tsx`) includes native touch gesture mechanics:
1. **Interactive Drag Handle (`.sheet-drag-handle-pill`):**
   - Positioned at the very top of the sheet with a generous touch area.
   - Glows emerald on touch and widens when expanded.
2. **Drag Down (Minimize / Dismiss):**
   - Directly tracks the user's finger downward in real-time (`translate3d(0, deltaY, 0)`) at 60/120fps.
   - If the sheet is expanded, dragging down collapses it back to compact height.
   - If in compact mode, dragging down past the threshold smoothly glides the sheet offscreen and dismisses it.
3. **Swipe Up (Expand to Full Screen):**
   - Swiping upward on the handle or header smoothly expands the sheet to **96dvh full-screen height**, maximizing visible form fields on mobile.
4. **Single-Tap Toggle:**
   - A single tap on the top handle pill instantly toggles between compact height and 96dvh full-screen mode.

---

## 📱 7. Mobile Viewport Standards, Anti-Zoom & Accessibility

### Viewport Containment & Zero Horizontal Overflow
* `html` and `body` enforce `max-width: 100vw` and `overflow-x: hidden`, eliminating horizontal scrollbars.
* Containers (`.app-shell`, `.main-shell`, `.main-content`) maintain natural unblocked vertical scrolling while constraining width to `100%`.
* Floating bottom dock offset: The main content container enforces `padding-bottom: max(140px, calc(110px + env(safe-area-inset-bottom, 16px)))` so bottom cards and buttons are never obscured by the floating navigation bar.

### Strict Mobile Zoom Prevention
* **iOS Safari Focus Auto-Zoom Elimination:** iOS Safari automatically forces viewport zoom on inputs with font-size `< 16px`. Divido strictly enforces `font-size: 16px !important` on all mobile inputs, selects, textareas, search bars, and amount inputs (`@media (max-width: 768px)`), completely preventing accidental zooming.
* **Double-Tap Zoom Elimination:** Interactive buttons and links utilize `touch-action: manipulation` to prevent double-tap zoom delays.
* **Text Clamping:** Typography on large figures uses `font-size: clamp(...)` and `word-break: break-word`, guaranteeing that large figures (e.g., `LKR 1,500,000.00`) never clip or push containers outside the screen.

### Accessibility Standards
* **WCAG Contrast Baseline:** Minimum 4.5:1 contrast ratio across all text and interactive elements.
* **Focus States:** High-visibility outline rings (`outline: 3px solid #10b98166`) on keyboard navigation.
* **Motion Preferences:** Full support for `@media (prefers-reduced-motion: reduce)`, disabling sliding animations and transitions for users with motion sensitivity.

---

## 🧩 8. Technical Component Inventory & State Architecture

### Component Catalog

| Component Name | File Path | Functional Role |
|---|---|---|
| **AppShell** | `components/layout/AppShell.tsx` | Root shell providing navigation, dialog orchestration, and dataVersion |
| **MobileDock** | `components/layout/MobileDock.tsx` | Raised floating mobile navigation bar with active halo bubble & Add button |
| **TopBar** | `components/layout/TopBar.tsx` | Desktop top bar with breadcrumbs, theme switcher, and profile avatar |
| **Sidebar** | `components/layout/Sidebar.tsx` | Collapsible desktop sidebar with brand logo and main/personal nav links |
| **PageTransitionOverlay** | `components/transition/PageTransitionOverlay.tsx` | Curtain veil overlay for seamless upward-swipe page reveals |
| **Modal** | `components/ui/Modal.tsx` | Accessible dialog & mobile bottom sheet with touch gesture minimize/expand |
| **QuickAddDialog** | `features/transactions/QuickAddDialog.tsx` | Initial bottom sheet choice between Add Expense and Add Income |
| **TransactionFormDialog**| `features/transactions/TransactionFormDialog.tsx` | Multi-field transaction form with client validation and patch updates |
| **TransactionDetailDialog**| `features/transactions/TransactionDetailDialog.tsx`| Full inspection sheet for viewing, editing, or deleting a record |
| **MonthSelector** | `components/financial/MonthSelector.tsx` | Period stepper control for switching active budget months (`YYYY-MM`) |
| **GroupBadge** | `components/financial/GroupBadge.tsx` | Semantic tag for Needs, Wants, Culture, and Unexpected |
| **MoneyField** | `components/forms/MoneyField.tsx` | Currency input field with tabular formatting and symbol prefix |
| **Button** | `components/ui/Button.tsx` | Styled button supporting primary, destructive, ghost, and loading states |
| **Toast** | `components/layout/Toast.tsx` | Global floating notification toast for mutation feedback |

### Global State & Synchronization
* **AppShellContext (`useAppShell`):**
  * Manages global modal state (`openAdd`, `openTransaction`, `openEdit`).
  * Emits notifications via `notify(message)`.
  * Increments `dataVersion` on mutations (adding, editing, or deleting transactions), prompting all active data queries to re-fetch without full page reloads.
* **useApiData Hook:**
  * Handles asynchronous data fetching with automatic retry logic, loading states, and error handling.

---

*Divido UI Architecture Documentation — Maintained by the Divido Core Engineering Team.*
