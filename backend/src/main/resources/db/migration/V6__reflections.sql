-- V6: Monthly reflection (DIV-028; DEC-034, DEC-035, DEC-036, DEC-038, DEC-039).
--
-- A new `reflections` table, deliberately not the legacy production table
-- `monthly_reflections` (DEC-036): that table exists only on production, from
-- the earlier V4, and is left untouched. Plain CREATE TABLE (no IF NOT EXISTS)
-- so an unexpected existing table fails the migration instead of being reused.
--
-- One reflection per user and calendar month. `version` is the optimistic
-- lock for DEC-039. Answers are stored one row per approved question; which
-- question IDs are valid is decided by the service for each question_set_version.
-- Both tables cascade from app_users, so removing an account removes its
-- reflections (DEC-038). Reflection text must never be logged.

CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    reflection_month DATE NOT NULL,
    question_set_version SMALLINT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_reflections_user_month UNIQUE (user_id, reflection_month),
    CONSTRAINT chk_reflections_first_day CHECK (EXTRACT(DAY FROM reflection_month) = 1),
    CONSTRAINT chk_reflections_question_set_version CHECK (question_set_version >= 1),
    CONSTRAINT chk_reflections_version CHECK (version >= 1)
);

CREATE TABLE reflection_answers (
    reflection_id UUID NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    answer TEXT NOT NULL,

    CONSTRAINT pk_reflection_answers PRIMARY KEY (reflection_id, question_id),
    -- DEC-035: 1 to 2,000 characters; blank answers are never stored (DEC-040).
    CONSTRAINT chk_reflection_answers_length CHECK (char_length(answer) BETWEEN 1 AND 2000),
    CONSTRAINT chk_reflection_answers_not_blank CHECK (btrim(answer) <> '')
);
