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

Per **DEC-013 (Approved)** and seeded in `V2__categories_and_income_sources.sql`:
- Exactly 3 shared global default categories are stored with `user_id IS NULL`:
  1. `Groceries` (category_type: `NEED`, slug: `groceries`, active: `true`)
  2. `Transport` (category_type: `NEED`, slug: `transport`, active: `true`)
  3. `Entertainment` (category_type: `WANT`, slug: `entertainment`, active: `true`)
- Global default categories are immutable to users and available to every authenticated user.
- Verified by automated Testcontainers test `CategoryIntegrationTest.flywaySeedsExactlyThreeGlobalDefaultCategories()`.

## 4. Seed mechanisms

A forward-only Flyway migration (`V2__categories_and_income_sources.sql`) inserts the 3 approved global default categories (`user_id IS NULL`). Because global defaults are shared (not copied per user per DEC-013), an application-level per-user seeder is not required for default categories.

## 5. System groups versus database rows

The four Kakeibo groups are represented in `categories.category_type` (`CHECK (category_type IN ('NEED', 'WANT', 'CULTURE', 'UNEXPECTED'))`). An explicit JPA AttributeConverter (`KakeiboGroupConverter`) maps between the database singular values (`NEED`, `WANT`) and the API/frontend plural enum keys (`NEEDS`, `WANTS`), tested in `KakeiboGroupMappingTest`.

## 6. Test data

- Use deterministic, synthetic fixtures.
- Never commit production users' transactions or reflection answers.
- Test categories for every group, category ownership, inactive categories, and historical references.
- Make tests independent of a shared mutable Neon dataset.

## 7. Open decisions

- Whether custom categories can be renamed, deactivated, or moved between groups by owners after historical transactions exist.
