# Seed Data Policy

**Status:** Proposed — default categories and mappings require owner approval

## 1. Purpose

Seed data establishes stable system-owned reference values such as the four Kakeibo groups and any approved default categories. It must be reproducible across local, test, staging, and production environments.

## 2. Proposed Kakeibo group values

Stable internal values:
- `NEEDS`
- `WANTS`
- `CULTURE`
- `UNEXPECTED`

Suggested display labels:
- Needs
- Wants
- Culture
- Unexpected

Display descriptions and examples need owner review. Keep stable internal enum keys separate from user-facing copy so future translation does not change stored values.

## 3. Default categories

The exact default category list and each category's group mapping are not approved yet. Do not seed a guessed final list into production.

Before seeding:
1. Approve category names and mappings.
2. Decide whether defaults are global shared rows or per-user copies.
3. Decide how existing users receive newly added defaults.
4. Define uniqueness and localization behavior.
5. Write deterministic seed/migration logic.
6. Add tests for expected category set and mappings.

## 4. Seed mechanisms

Choose one primary strategy consistent with the current repository:
- Flyway migration inserts stable reference data; or
- a dedicated idempotent application seeder for data that must be created per user.

Do not mix strategies without clear ownership. Re-running a seeder must not create duplicates.

## 5. System groups versus database rows

The four Kakeibo groups may be represented as an enum rather than a mutable table. Choose based on whether groups need admin-managed metadata. Do not store duplicate group labels in every transaction if the category/group relationship is the approved source of truth.

## 6. Test data

- Use deterministic, synthetic fixtures.
- Never commit production users' transactions or reflection answers.
- Test categories for every group, category ownership, inactive categories, and historical references.
- Make tests independent of a shared mutable Neon dataset.

## 7. Open decisions

- Exact default categories.
- Shared global defaults versus per-user copies.
- Whether categories can be renamed, deactivated, or moved between groups.
- How new defaults reach existing users.
- Seed mechanism and idempotency strategy.
