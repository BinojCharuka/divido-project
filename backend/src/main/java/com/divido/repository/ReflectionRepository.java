package com.divido.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Data access for {@code reflections} and {@code reflection_answers} (Flyway V6).
 * Every statement is scoped by {@code user_id}, which the service takes from the
 * session. Writes are single statements so the version check (DEC-039) is atomic.
 * Nothing here logs answer text.
 */
@Repository
public class ReflectionRepository {

    public record ReflectionRow(UUID id, LocalDate month, int questionSetVersion, int version,
                                Instant createdAt, Instant updatedAt) {
    }

    public record SummaryRow(LocalDate month, int answeredCount, Instant updatedAt) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public ReflectionRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ReflectionRow> find(UUID userId, LocalDate month) {
        List<ReflectionRow> rows = jdbc.query("""
                SELECT id, reflection_month, question_set_version, version, created_at, updated_at
                FROM reflections WHERE user_id = :userId AND reflection_month = :month
                """, params(userId, month), (rs, i) -> new ReflectionRow(
                rs.getObject("id", UUID.class),
                rs.getObject("reflection_month", LocalDate.class),
                rs.getInt("question_set_version"),
                rs.getInt("version"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()));
        return rows.stream().findFirst();
    }

    /** Answers keyed by question id. */
    public Map<String, String> answers(UUID reflectionId) {
        Map<String, String> result = new java.util.LinkedHashMap<>();
        jdbc.query("SELECT question_id, answer FROM reflection_answers WHERE reflection_id = :id",
                new MapSqlParameterSource("id", reflectionId),
                rs -> {
                    result.put(rs.getString("question_id"), rs.getString("answer"));
                });
        return result;
    }

    /**
     * First save. {@code ON CONFLICT DO NOTHING} makes two simultaneous first saves
     * safe: one inserts, the other gets no row back and reports a conflict.
     */
    public Optional<UUID> insertIfAbsent(UUID userId, LocalDate month, int questionSetVersion) {
        List<UUID> ids = jdbc.queryForList("""
                INSERT INTO reflections (user_id, reflection_month, question_set_version)
                VALUES (:userId, :month, :qsv)
                ON CONFLICT ON CONSTRAINT uq_reflections_user_month DO NOTHING
                RETURNING id
                """, params(userId, month).addValue("qsv", questionSetVersion), UUID.class);
        return ids.stream().findFirst();
    }

    /**
     * Edit. Succeeds only when the stored version still equals {@code expectedVersion};
     * the row lock taken by UPDATE makes a concurrent edit with the same version wait
     * and then fail the check.
     */
    public Optional<UUID> bumpVersion(UUID userId, LocalDate month, int expectedVersion, int questionSetVersion) {
        List<UUID> ids = jdbc.queryForList("""
                UPDATE reflections
                SET version = version + 1, question_set_version = :qsv, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :userId AND reflection_month = :month AND version = :expected
                RETURNING id
                """, params(userId, month).addValue("expected", expectedVersion).addValue("qsv", questionSetVersion),
                UUID.class);
        return ids.stream().findFirst();
    }

    public void replaceAnswers(UUID reflectionId, Map<String, String> answers) {
        MapSqlParameterSource id = new MapSqlParameterSource("id", reflectionId);
        jdbc.update("DELETE FROM reflection_answers WHERE reflection_id = :id", id);
        for (Map.Entry<String, String> entry : answers.entrySet()) {
            jdbc.update("""
                    INSERT INTO reflection_answers (reflection_id, question_id, answer)
                    VALUES (:id, :questionId, :answer)
                    """, new MapSqlParameterSource("id", reflectionId)
                    .addValue("questionId", entry.getKey())
                    .addValue("answer", entry.getValue()));
        }
    }

    /** Permanent delete (DEC-038); answers go with it through ON DELETE CASCADE. */
    public boolean delete(UUID userId, LocalDate month) {
        return jdbc.update("DELETE FROM reflections WHERE user_id = :userId AND reflection_month = :month",
                params(userId, month)) > 0;
    }

    /** History without answer text (DEC-038), newest month first. */
    public List<SummaryRow> summaries(UUID userId) {
        return jdbc.query("""
                SELECT r.reflection_month, r.updated_at, count(a.question_id) AS answered
                FROM reflections r LEFT JOIN reflection_answers a ON a.reflection_id = r.id
                WHERE r.user_id = :userId
                GROUP BY r.id, r.reflection_month, r.updated_at
                ORDER BY r.reflection_month DESC
                """, new MapSqlParameterSource("userId", userId), (rs, i) -> new SummaryRow(
                rs.getObject("reflection_month", LocalDate.class),
                rs.getInt("answered"),
                toInstant(rs.getTimestamp("updated_at"))));
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static MapSqlParameterSource params(UUID userId, LocalDate month) {
        return new MapSqlParameterSource("userId", userId).addValue("month", month);
    }
}
