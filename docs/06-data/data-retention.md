# Data Retention and Lifecycle

**Status:** Proposed policy — owner/privacy review required before public release

## 1. Purpose

Define how Divido retains, hides, restores, backs up, exports, and permanently removes personal financial data. This document is not legal advice; review requirements for intended launch markets before production.

## 2. Data categories

Potential data classes:
- Account identifiers and credential hashes.
- User preferences.
- Categories and income-source labels.
- Income and expense entries.
- Monthly plans and savings targets.
- Optional monthly reflection answers.
- Session records.
- Operational/security logs.
- Database backups.

Each class may need a different retention period and deletion procedure.

## 3. Proposed soft-delete behavior

If soft deletion is approved for transactions:
- A delete action sets a server-managed `deleted_at` or equivalent marker.
- Normal transaction lists and financial calculations exclude deleted rows.
- Restore is allowed only for the owner and only while the record remains retained.
- A restored row is included in calculations once.
- Deactivation of a category/source must not erase historical transactions.
- Soft-deleted data remains personal data and must still be access-controlled.

The retention period for soft-deleted rows is TBD. Do not assume indefinite retention.

## 4. Account closure and permanent deletion

Before production, define:
- Whether users can close/delete their account.
- Confirmation and re-authentication requirements.
- How financial records, categories, plans, reflections, and sessions are handled.
- Whether any records must be retained for legal/security reasons.
- How backups age out after deletion.
- Whether deletion is immediate or scheduled.
- How the user is informed of completion.

Do not implement account deletion by blindly cascading all rows until the data-lifecycle policy is approved.

## 5. Reflection privacy

Reflection answers may contain sensitive personal details. Approved rules (DEC-035, DEC-038, 2026-11-16), implemented in DIV-028:
- Answer contents are never logged or included in error messages.
- Only the owner can read, edit or delete a reflection; another user's reflection is reported as not found.
- At most 2,000 characters per answer.
- Editable at any time; deletion is permanent and user-initiated. No drafts on the server or in the browser.
- Kept until the user deletes it or the account is removed (`ON DELETE CASCADE` from `app_users`).
- Not used for analytics; the history list never includes answer text.
- Still open: backups may hold deleted reflections until the backup expires (DIV-033), and account deletion is not yet a feature (DIV-035).
- The legacy production table `monthly_reflections` holds one row from the earlier V4. It is untouched and not shown in the app (DEC-036); its retention must be decided with DIV-035.

## 6. Logs and sessions

- Never log passwords, session IDs, CSRF tokens, reset tokens, or unnecessary transaction/reflection content.
- Keep operational logs only for an approved period and restrict access.
- Expire and invalidate sessions according to the security policy.
- Keep audit/correlation IDs free of personal information.

## 7. Backups

Before release, document:
- Backup frequency and retention.
- Encryption and access control.
- Restore objective and recovery time objective.
- Restore testing cadence.
- How deleted/account-closed data ages out of backup copies.
- Responsible owner for backup/restore operations.

## 8. Open decisions before production

1. Transaction soft-delete and restore inclusion in MVP.
2. Retention period for deleted transactions.
3. Account closure/permanent deletion behavior.
4. ~~Reflection inclusion and retention.~~ Decided 2026-11-16 (DEC-030, DEC-038); backups and the legacy row remain open (DIV-033, DIV-035).
5. Session retention and expiry.
6. Log retention and redaction.
7. Backup retention and restore process.
8. Data export requirements.
9. Privacy/legal review for intended launch markets.
