# User Stories

**Status:** Proposed — owner review required

Story IDs are intended for issue tracking. Each story must be split into smaller tasks when it cannot be completed, reviewed, and tested in a practical pull request.

## Epic E-01 — Account and onboarding

### US-001 — Create an account
As a visitor, I want to create an individual account so that my financial records are private to me.

- **Priority:** P0
- **Use case:** UC-001
- **UX:** UX-P02
- **Depends on:** Approved authentication and security decisions
- **Acceptance:** AC-001, AC-002
- **Decided:** email identifier and 8–72 character passwords (`DEC-021` to `DEC-024`); no email verification in the MVP; recovery by emailed reset link (`DEC-045`, see US-019).

### US-002 — Sign in and sign out
As a returning user, I want to sign in and securely end my session.

- **Priority:** P0
- **Use case:** UC-002
- **UX:** UX-P01
- **Acceptance:** AC-003, AC-004

### US-003 — Complete initial setup
As a new user, I want to set my preferences and initial plan so that the dashboard can explain my intended money plan.

- **Priority:** P1 (onboarding is skippable)
- **Use case:** UC-003
- **UX:** UX-P03
- **Acceptance:** AC-005
- **Decided (`DEC-044`):** three steps: welcome; this month's planned income and savings; done. Every step can be skipped. Finishing or skipping is stored once. An existing plan is never overwritten. Implemented in DIV-023.

## Epic E-02 — Income and expenses

### US-004 — Record an expense quickly
As a user, I want to record an expense with an amount and category so that I can track spending with minimal effort.

- **Priority:** P0
- **Use case:** UC-005
- **UX:** UX-P06
- **Acceptance:** AC-006, AC-007, AC-008

### US-005 — Record income
As a user, I want to record income and identify its source where required so that my actual income is visible separately from planned income.

- **Priority:** P0
- **Use case:** UC-006
- **UX:** UX-P07
- **Acceptance:** AC-009

### US-006 — Browse transactions
As a user, I want to review and filter my entries so that I can understand what I recorded.

- **Priority:** P0
- **Use case:** UC-007
- **UX:** UX-P05
- **Acceptance:** AC-010, AC-011

### US-007 — Edit a transaction
As a user, I want to correct an entry so that my summaries remain accurate.

- **Priority:** P0
- **Use case:** UC-008
- **UX:** UX-P08
- **Acceptance:** AC-012

### US-008 — Soft-delete an entry
As a user, I want to remove an incorrect entry without irreversible loss so that I can correct mistakes.

- **Priority:** P1 — owner must confirm MVP inclusion
- **Use case:** UC-009
- **Acceptance:** AC-013

### US-009 — Restore a deleted entry
As a user, I want to restore a deleted entry if I removed it by mistake.

- **Priority:** P2 — depends on restore UI approval
- **Use case:** UC-016
- **Acceptance:** AC-014

## Epic E-03 — Budget and dashboard

### US-010 — View monthly dashboard
As a user, I want a clear monthly overview so that I can compare planned and recorded money activity.

- **Priority:** P0
- **Use case:** UC-004
- **UX:** UX-P04
- **Acceptance:** AC-015, AC-016

### US-011 — Create or update a monthly plan
As a user, I want to set planned income, a savings target, and four group allocations so that I can make a conscious plan for the month.

- **Priority:** P0
- **Use case:** UC-010
- **UX:** UX-P09
- **Acceptance:** AC-017, AC-018
- **TBD:** Over-allocation save behavior.

## Epic E-04 — Insights and reflection

### US-012 — View spending insights
As a user, I want understandable observations from my recorded spending so that I can notice patterns without being judged.

- **Priority:** P1 — in MVP (DEC-030, approved 2026-11-16)
- **Use case:** UC-011
- **UX:** UX-P10
- **Acceptance:** AC-019, AC-020
- **Rules:** Observation types, thresholds and wording approved in DEC-031, DEC-032, DEC-033, DEC-041; implemented in DIV-027 ([`../05-api/insights-api.md`](../05-api/insights-api.md)).

### US-013 — Save a monthly reflection
As a user, I want to reflect on the month so that I can learn from my decisions and plan changes.

- **Priority:** P1 — in MVP (DEC-030, approved 2026-11-16)
- **Use case:** UC-012
- **UX:** UX-P11
- **Acceptance:** AC-021
- **Rules:** Questions, persistence, editing and retention approved in DEC-034 to DEC-040; implemented in DIV-028 ([`../05-api/reflections-api.md`](../05-api/reflections-api.md)).

## Epic E-05 — Personalization

### US-014 — Manage custom categories
As a user, I want to add categories that fit my life so that I can classify expenses meaningfully.

- **Priority:** P1
- **Use case:** UC-013
- **UX:** UX-P13
- **Acceptance:** AC-022, AC-023

### US-015 — Manage income sources
As a user, I want to manage income-source labels so that income entries and plans use terms I understand.

- **Priority:** P1
- **Use case:** UC-014
- **UX:** UX-P14
- **Acceptance:** AC-024

### US-016 — Manage preferences
As a user, I want to review my basic preferences so that the app uses the correct display settings.

- **Priority:** P1
- **Use case:** UC-014
- **UX:** UX-P12
- **Acceptance:** AC-025
- **Decided (`DEC-043`):** the display name and the password can change; the password change needs the current password. Currency (LKR), timezone (Asia/Colombo) and language (English) are shown read-only. Implemented in DIV-022.

## Epic E-06 — Security and reliability

### US-017 — Handle session expiry
As a user, I want a clear sign-in recovery path when my session expires so that I understand why an action failed.

- **Priority:** P0
- **Use case:** UC-015
- **Acceptance:** AC-026

### US-018 — Prevent access to another user's data
As a user, I want every record protected by server-side ownership checks so that other users cannot read or change my financial information.

- **Priority:** P0
- **Use cases:** UC-002, UC-005–UC-016
- **Acceptance:** AC-027, AC-028

### US-019 — Reset a forgotten password
As a user who forgot my password, I want to get a reset link by email so that I can sign in again without anyone learning whether my email is registered.

- **Priority:** P1
- **UX:** `/forgot-password`, `/reset-password`
- **Acceptance:** AC-033, AC-034
- **Decided:** `DEC-045`; implemented in DIV-029.

### US-020 — Delete my account
As a user, I want to delete my account and all my data myself so that nothing of mine stays in the app.

- **Priority:** P1
- **UX:** Settings → Delete account
- **Acceptance:** AC-035
- **Decided:** `DEC-046`; implemented in DIV-035.

## Story implementation checklist

A story is not ready for implementation until:
- Scope and acceptance criteria are understood.
- Dependencies and owner decisions are resolved or explicitly accepted as a temporary assumption.
- UI states and relevant API/data contracts are linked.
- Test cases exist or are planned.
- Security and privacy implications are reviewed.

A story is not done until its acceptance criteria pass, tests pass, documentation is updated, and the PR is reviewed.
