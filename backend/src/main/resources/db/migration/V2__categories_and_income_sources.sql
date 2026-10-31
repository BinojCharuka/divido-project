-- Migration V2: Add is_active/updated_at to categories, seed 3 global default categories, and create income_sources table.

-- 1. Extend categories table
ALTER TABLE categories
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Unique partial indexes for category name and slug
CREATE UNIQUE INDEX idx_categories_user_name
    ON categories (user_id, LOWER(TRIM(name)))
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_categories_user_slug
    ON categories (user_id, slug)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_categories_global_name
    ON categories (LOWER(TRIM(name)))
    WHERE user_id IS NULL;

CREATE UNIQUE INDEX idx_categories_global_slug
    ON categories (slug)
    WHERE user_id IS NULL;

-- 2. Seed 3 global default categories (user_id IS NULL) per DEC-013
INSERT INTO categories (id, user_id, name, slug, category_type, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), NULL, 'Groceries', 'groceries', 'NEED', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), NULL, 'Transport', 'transport', 'NEED', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), NULL, 'Entertainment', 'entertainment', 'WANT', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Create income_sources table
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_income_sources_user_id
    ON income_sources (user_id);

CREATE UNIQUE INDEX idx_income_sources_user_name
    ON income_sources (user_id, LOWER(TRIM(name)));
