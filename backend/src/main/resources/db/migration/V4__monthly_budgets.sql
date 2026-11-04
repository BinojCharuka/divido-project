-- Migration V4: monthly budget plans (DIV-025, rules approved in DIV-017).
--
-- One plan per user per calendar month. budget_month stores the first day of the
-- month so month arithmetic stays in DATE; the CHECK keeps any other day out.
-- Amounts use the same NUMERIC(12,2) type as transactions.amount. Zero is a valid
-- planned amount; negative values are rejected here and in the service layer.

CREATE TABLE monthly_budgets (
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

-- The unique constraint's index (user_id, budget_month) serves the per-user lookup.
