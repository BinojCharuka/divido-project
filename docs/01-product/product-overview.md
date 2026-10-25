# Divido Product Overview

**Status:** PROPOSED  
**Version:** 0.1

## 1. Product vision

Divido is a personal finance application inspired by Japanese Kakeibo. It helps individuals record income and expenses, plan monthly spending and savings, and reflect on recurring spending patterns.

## 2. Problem statement

People can find it difficult to keep a consistent record of everyday spending, understand where their money goes, and compare actual spending with a plan. A long or complicated transaction form can discourage daily use.

## 3. Product goals

1. Make ordinary expense recording fast.
2. Give users a clear monthly view of planned income, actual income, expenses, and savings.
3. Help users organize spending into four Kakeibo groups.
4. Show spending patterns based on recorded data without inventing facts.
5. Support a useful monthly reflection.
6. Keep each user's financial data private and protected.

## 4. Primary user

An individual who wants to manually track personal income and spending. The initial product language is English and the initial currency default is LKR, with `Asia/Colombo` as the proposed timezone default.

## 5. Core product loop

1. Plan: enter expected monthly income, a savings target, and group budgets.
2. Record: quickly add income and expenses as they occur.
3. Understand: compare actual spending against the plan and view supported spending patterns.
4. Reflect: answer monthly reflection questions and adjust the next month's plan.

## 6. Product experience principles

- Quick entry before advanced features.
- Show totals and definitions clearly.
- Never imply a bank balance when the product only knows recorded transactions.
- Never infer a specific purchase habit when only broad category evidence exists.
- Make editing and recovery of accidentally deleted transactions possible.
- Make mobile core flows usable.

## 7. Success measures (proposed)

These measures require owner review before being used as release targets:
- A new user can add an expense without completing optional fields.
- A saved transaction appears in history and monthly totals.
- Users can compare planned group budgets with actual spending.
- Habit insights show their period and evidence basis.
- Core flows pass acceptance, access-control, and mobile usability tests.

## 8. Explicit exclusions from the MVP

- Sending money or integrating with a bank/payment provider.
- Shared household expenses.
- Money lending and repayment tracking.
- Automatic recurring transactions or bill payments.
- Multi-account balance tracking.

See [`mvp-scope.md`](mvp-scope.md), [`scope-and-decisions.md`](scope-and-decisions.md), and [`future-features.md`](future-features.md).
