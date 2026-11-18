package com.divido.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.UUID;

/**
 * Account fields that change after registration (DIV-022, DIV-023, DIV-029, DIV-035).
 * Every statement is scoped by the user ID taken from the session or from a verified
 * reset token, never from request input.
 */
@Repository
public class AccountRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public AccountRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Profile(UUID id, String email, String displayName, String currency, String timezone,
            boolean onboardingComplete) {
    }

    public record Credentials(UUID id, String email, String displayName, String passwordHash,
            int credentialsVersion) {
    }

    public Optional<Profile> findProfile(UUID userId) {
        List<Profile> rows = jdbc.query("""
                SELECT id, email, display_name, currency, timezone, onboarding_completed_at IS NOT NULL AS onboarded
                FROM app_users WHERE id = :id
                """, new MapSqlParameterSource("id", userId),
                (rs, i) -> new Profile(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("currency"), rs.getString("timezone"),
                        rs.getBoolean("onboarded")));
        return rows.stream().findFirst();
    }

    public boolean isOnboardingComplete(UUID userId) {
        return findProfile(userId).map(Profile::onboardingComplete).orElse(false);
    }

    public Optional<Credentials> findCredentials(UUID userId) {
        return credentials("id = :key", userId);
    }

    public Optional<Credentials> findCredentialsByEmail(String normalizedEmail) {
        return credentials("email = :key", normalizedEmail);
    }

    private Optional<Credentials> credentials(String where, Object key) {
        List<Credentials> rows = jdbc.query(
                "SELECT id, email, display_name, password_hash, credentials_version FROM app_users WHERE " + where,
                new MapSqlParameterSource("key", key),
                (rs, i) -> new Credentials(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("password_hash"),
                        rs.getInt("credentials_version")));
        return rows.stream().findFirst();
    }

    /** The current credentials version, or empty when the account no longer exists. */
    public OptionalInt credentialsVersion(UUID userId) {
        List<Integer> rows = jdbc.queryForList("SELECT credentials_version FROM app_users WHERE id = :id",
                new MapSqlParameterSource("id", userId), Integer.class);
        return rows.isEmpty() ? OptionalInt.empty() : OptionalInt.of(rows.getFirst());
    }

    public void updateDisplayName(UUID userId, String displayName, Instant now) {
        jdbc.update("UPDATE app_users SET display_name = :name, updated_at = :now WHERE id = :id",
                new MapSqlParameterSource("id", userId).addValue("name", displayName)
                        .addValue("now", Timestamp.from(now)));
    }

    /** Records completion once; later calls keep the first time. */
    public void markOnboardingComplete(UUID userId, Instant now) {
        jdbc.update("""
                UPDATE app_users SET onboarding_completed_at = :now, updated_at = :now
                WHERE id = :id AND onboarding_completed_at IS NULL
                """, new MapSqlParameterSource("id", userId).addValue("now", Timestamp.from(now)));
    }

    /**
     * Stores a new password hash and increments the credentials version, which ends
     * every session signed in with the old version.
     *
     * @return the new credentials version, or empty when the account no longer exists
     */
    public OptionalInt replacePassword(UUID userId, String passwordHash, Instant now) {
        List<Integer> rows = jdbc.queryForList("""
                UPDATE app_users
                SET password_hash = :hash, credentials_version = credentials_version + 1, updated_at = :now
                WHERE id = :id
                RETURNING credentials_version
                """, new MapSqlParameterSource("id", userId).addValue("hash", passwordHash)
                        .addValue("now", Timestamp.from(now)), Integer.class);
        return rows.isEmpty() ? OptionalInt.empty() : OptionalInt.of(rows.getFirst());
    }

    /**
     * Deletes the account and everything it owns (DEC-046). Transactions go first:
     * they reference categories and income sources with ON DELETE RESTRICT, so the
     * cascade from app_users alone could be refused. Everything else cascades.
     *
     * @return whether an account was deleted
     */
    public boolean deleteAccount(UUID userId) {
        MapSqlParameterSource id = new MapSqlParameterSource("id", userId);
        jdbc.update("DELETE FROM transactions WHERE user_id = :id", id);
        return jdbc.update("DELETE FROM app_users WHERE id = :id", id) == 1;
    }
}
