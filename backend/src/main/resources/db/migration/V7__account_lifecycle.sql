-- V7: account lifecycle (DIV-022, DIV-023, DIV-029, DIV-035; DEC-043 to DEC-046).
--
-- New column names on purpose: the production database also has legacy
-- `app_users.onboarding_complete` and `app_users.locale` columns from the earlier
-- V4 (see docs/09-release-operations/neon-flyway-v4-drift.md). They are left
-- untouched and are not read.

-- DEC-044: when onboarding was finished or skipped; NULL means not yet.
ALTER TABLE app_users ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- Accounts that existed before onboarding are treated as complete (DEC-044).
UPDATE app_users SET onboarding_completed_at = created_at;

-- DEC-043/DEC-045: incremented on every password change or reset. A session that
-- was signed in with an older value is ended on its next request.
ALTER TABLE app_users ADD COLUMN credentials_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD CONSTRAINT chk_app_users_credentials_version CHECK (credentials_version >= 0);

-- DEC-045: password reset links. Only the SHA-256 hash of the token is stored
-- (64 lowercase hex characters); the token itself exists only in the email.
-- Expiry is compared with the application clock, not the database clock.
-- Plain CREATE TABLE so an unexpected existing table fails the migration.
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash),
    CONSTRAINT chk_password_reset_tokens_hash CHECK (token_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
