-- Migration V3: Create transactions table with constraints and indexes per DIV-011.

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    income_source_id UUID REFERENCES income_sources(id) ON DELETE RESTRICT,
    description VARCHAR(500),
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_transactions_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0),
    CONSTRAINT chk_transactions_type_references CHECK (
        (type = 'EXPENSE' AND category_id IS NOT NULL AND income_source_id IS NULL)
        OR
        (type = 'INCOME' AND category_id IS NULL)
    )
);

-- Indexes for performance and foreign key lookups
CREATE INDEX idx_transactions_user_date
    ON transactions (user_id, transaction_date DESC, created_at DESC);

CREATE INDEX idx_transactions_user_type_date
    ON transactions (user_id, type, transaction_date DESC, created_at DESC);

CREATE INDEX idx_transactions_category_id
    ON transactions (category_id);

CREATE INDEX idx_transactions_income_source_id
    ON transactions (income_source_id);
