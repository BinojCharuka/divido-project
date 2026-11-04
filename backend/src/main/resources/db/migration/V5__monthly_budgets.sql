-- V5: Reconcile the Phase 03 monthly budget table across two V4 histories.
--
-- The production Neon database records an earlier V4
-- (V4__budgets_reflections_profile.sql), while the current repository's V4
-- (V4__monthly_budgets.sql) already creates this table on fresh databases.
-- On production this creates the missing table; on a fresh database V4 has
-- already created it, so V5 safely skips the already-created table.
--
-- Do not drop or rewrite the legacy production V4 objects (budgets,
-- monthly_reflections, app_users.locale, app_users.onboarding_complete).

CREATE TABLE IF NOT EXISTS monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    budget_month DATE NOT NULL,
    planned_income NUMERIC(12,2) NOT NULL,
    savings_target NUMERIC(12,2) NOT NULL,
    needs_allocation NUMERIC(12,2) NOT NULL,
    wants_allocation NUMERIC(12,2) NOT NULL,
    culture_allocation NUMERIC(12,2) NOT NULL,
    unexpected_allocation NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_monthly_budgets_user_month UNIQUE (user_id, budget_month),
    CONSTRAINT chk_monthly_budgets_first_day CHECK (EXTRACT(DAY FROM budget_month) = 1),
    CONSTRAINT chk_monthly_budgets_planned_income CHECK (planned_income >= 0),
    CONSTRAINT chk_monthly_budgets_savings_target CHECK (savings_target >= 0),
    CONSTRAINT chk_monthly_budgets_needs CHECK (needs_allocation >= 0),
    CONSTRAINT chk_monthly_budgets_wants CHECK (wants_allocation >= 0),
    CONSTRAINT chk_monthly_budgets_culture CHECK (culture_allocation >= 0),
    CONSTRAINT chk_monthly_budgets_unexpected CHECK (unexpected_allocation >= 0)
);
