-- TEST FIXTURE ONLY. Not the production migration, and never to be applied to a real
-- database. The source of the production V4 is lost (see
-- docs/09-release-operations/neon-flyway-v4-drift.md); this is a synthetic stand-in built
-- from the documented object names, so its column details and checksum differ from
-- production. It exists to exercise the repair-then-migrate sequence on a disposable
-- database. It lives outside db/migration so the application can never load it.

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    CONSTRAINT uq_budgets_user_month UNIQUE (user_id, month)
);

CREATE TABLE monthly_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    content TEXT
);

ALTER TABLE app_users ADD COLUMN locale VARCHAR(10);
ALTER TABLE app_users ADD COLUMN onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
