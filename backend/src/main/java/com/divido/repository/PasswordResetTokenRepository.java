package com.divido.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Password reset tokens (DEC-045). Only SHA-256 hashes are stored or compared. */
@Repository
public class PasswordResetTokenRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public PasswordResetTokenRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** A new link voids every earlier one for the account. */
    public void replaceForUser(UUID userId, String tokenHash, Instant now, Instant expiresAt) {
        MapSqlParameterSource params = new MapSqlParameterSource("userId", userId)
                .addValue("hash", tokenHash)
                .addValue("now", Timestamp.from(now))
                .addValue("expiresAt", Timestamp.from(expiresAt));
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = :userId", params);
        jdbc.update("""
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
                VALUES (:userId, :hash, :expiresAt, :now)
                """, params);
    }

    /**
     * Marks an unused, unexpired token as used, atomically: of two concurrent
     * attempts with the same token, exactly one gets the account ID.
     */
    public Optional<UUID> consume(String tokenHash, Instant now) {
        List<UUID> rows = jdbc.queryForList("""
                UPDATE password_reset_tokens SET used_at = :now
                WHERE token_hash = :hash AND used_at IS NULL AND expires_at > :now
                RETURNING user_id
                """, new MapSqlParameterSource("hash", tokenHash).addValue("now", Timestamp.from(now)), UUID.class);
        return rows.stream().findFirst();
    }

    public void deleteForUser(UUID userId) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = :userId",
                new MapSqlParameterSource("userId", userId));
    }
}
