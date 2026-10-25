# Future Features

**Status:** PROPOSED — excluded from MVP

This document records features that have been discussed but must not be accidentally included in the first release.

## FUT-LEND-001 — Money Lending Tracker

### User problem

A user sometimes lends money to another person and wants to remember who borrowed it, how much was lent, how much was repaid, and how much remains outstanding.

### Proposed future flow

1. Open Money Lending.
2. Search for a person by username or phone number.
3. Verify that the matched person is the intended recipient.
4. Record the amount, date, and optional note.
5. Record repayments over time.
6. View lent, repaid, and outstanding amounts.

### Important boundaries

- This is a record-keeping feature, not a money-transfer or banking feature.
- A search result must not reveal private account information to unauthorized users.
- Phone-number search requires privacy, identity verification, rate-limiting, and consent decisions.
- The feature may require a contact/identity model and a separate loan/repayment ledger; do not simply treat a loan as an ordinary expense without an approved accounting rule.
- Interest, reminders, partial repayments, disputes, and cancellation are unresolved future requirements.

### MVP status

`OUT OF MVP`. No UI, API, database migration, or code for this feature should be added during MVP implementation unless the project owner approves a scope change.

## Other deferred ideas

- Shared household expenses and split calculations.
- Bank and payment-provider integrations.
- Multi-account balances.
- Automatic recurring expenses and reminders.
- Additional UI languages.

Add a feature here when it has been discussed but is not yet approved for the MVP.
