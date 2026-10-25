# Divido Data & Database Documentation

**Status:** Proposed logical design — must be reconciled with the live PostgreSQL schema before migrations are written.  
**Set:** 6 — Data & Database  
**Depends on:** Sets 1–5, especially approved business rules and API contracts.

## Purpose

Define data entities, relationships, field meanings, integrity constraints, migration discipline, seed data, and retention policy. This set is intended to prevent frontend/backend/database implementations from making incompatible assumptions.

## Documents
- [Entity relationships](entity-relationships.md)
- [Data dictionary](data-dictionary.md)
- [Migration policy](migration-policy.md)
- [Seed data](seed-data.md)
- [Data retention](data-retention.md)

## Existing project context to verify

Previous project discussion indicates:
- PostgreSQL database hosted on Neon.
- Flyway is used for schema migrations.
- `V1__init.sql` has already been applied.
- Existing tables include `app_users`, `categories`, and `flyway_schema_history`.

These are not a substitute for inspecting the current database and migration file. Before implementation, inspect the existing DDL, constraints, indexes, entity classes, and Flyway history. Do not guess column names from table names.

## Non-negotiable migration rule

**Never edit an applied migration.** If `V1__init.sql` has been applied in a shared database, preserve it exactly and create the next versioned migration (e.g. `V2__...sql`) for new changes. Do not delete or manually rewrite Flyway history to make a migration appear unapplied.

## Design status

The entities and fields in this set are candidates, not final schema. Decide the transaction model (single table vs separate income/expense tables), default-category ownership, money precision, soft-delete policy, and reflection inclusion before freezing migrations.
