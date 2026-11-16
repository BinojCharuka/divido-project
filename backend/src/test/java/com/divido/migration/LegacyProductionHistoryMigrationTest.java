package com.divido.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.output.ValidateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Rehearses the DIV-036 runbook on a disposable database whose history looks like
 * production: V1-V3 from the repository, then a different V4 that created the legacy
 * objects. The V4 is a synthetic fixture because the real source is lost, so this shows
 * how Flyway handles the shape of the drift, not that production itself is safe.
 */
class LegacyProductionHistoryMigrationTest {

    private static final String REPOSITORY = "classpath:db/migration";
    private static final String LEGACY_V4 = "classpath:db/legacy-v4-fixture";
    private static final String REPOSITORY_V4_SCRIPT = "V4__monthly_budgets.sql";
    private static final String LEGACY_V4_SCRIPT = "V4__budgets_reflections_profile.sql";

    private PostgreSQLContainer postgres;
    private JdbcTemplate jdbc;

    @BeforeEach
    void startDisposableDatabase() {
        postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:18-alpine"));
        postgres.start();
        jdbc = new JdbcTemplate(new DriverManagerDataSource(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
    }

    @AfterEach
    void stopDisposableDatabase() {
        postgres.stop();
    }

    @Test
    void repositoryMigrationsAreRejectedUntilV4IsRepaired() {
        createLegacyHistory();

        ValidateResult result = repository().validateWithResult();

        assertThat(result.validationSuccessful).as("V4 drift must fail validation").isFalse();
        assertThat(repository().info().pending()).extracting(m -> m.getVersion().getVersion()).containsExactly("5");
    }

    @Test
    void repairAlignsV4WithoutRunningItsSqlOrApplyingV5() {
        createLegacyHistory();

        repository().repair();

        assertThat(tableExists("monthly_budgets")).as("repair must not create tables").isFalse();
        assertThat(repository().validateWithResult().validationSuccessful).isTrue();
        Map<String, Object> v4 = jdbc.queryForMap(
                "SELECT description, script, success FROM flyway_schema_history WHERE version = '4'");
        // Repair realigns description and checksum only; the recorded script name stays.
        assertThat(v4)
                .containsEntry("description", "monthly budgets")
                .containsEntry("script", LEGACY_V4_SCRIPT)
                .containsEntry("success", true);
        assertThat(repository().info().pending()).extracting(m -> m.getVersion().getVersion()).containsExactly("5");
    }

    @Test
    void repairThenMigrateCreatesMonthlyBudgetsAndPreservesLegacyData() {
        createLegacyHistory();
        UUID userId = UUID.randomUUID();
        jdbc.update("INSERT INTO app_users (id, email, password_hash, display_name, locale) VALUES (?, ?, ?, ?, ?)",
                userId, "legacy-" + userId + "@example.com", "$2a$10$syntheticHashForTestOnly", "Legacy User", "en");
        jdbc.update("INSERT INTO budgets (user_id, month) VALUES (?, '2026-10')", userId);
        jdbc.update("INSERT INTO monthly_reflections (user_id, month, content) VALUES (?, '2026-10', 'synthetic')", userId);

        repository().repair();
        repository().migrate();

        assertThat(repository().info().pending()).isEmpty();
        assertThat(repository().info().all())
                .allSatisfy(migration -> assertThat(migration.getState()).isEqualTo(MigrationState.SUCCESS));
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'monthly_budgets'",
                Integer.class)).isEqualTo(11);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM monthly_budgets", Integer.class)).isZero();

        assertThat(jdbc.queryForObject("SELECT content FROM monthly_reflections WHERE user_id = ?", String.class, userId))
                .isEqualTo("synthetic");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM budgets WHERE user_id = ?", Integer.class, userId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT locale FROM app_users WHERE id = ?", String.class, userId)).isEqualTo("en");
    }

    @Test
    void cleanDatabaseMigratesThroughEveryRepositoryMigration() {
        repository().migrate();

        assertThat(repository().info().pending()).isEmpty();
        assertThat(jdbc.queryForObject(
                "SELECT script FROM flyway_schema_history WHERE version = '4'", String.class))
                .isEqualTo(REPOSITORY_V4_SCRIPT);
        assertThat(tableExists("monthly_budgets")).isTrue();
        assertThat(tableExists("monthly_reflections")).isFalse();
    }

    /** V1-V3 from the repository, then the legacy V4, as recorded in production's history. */
    private void createLegacyHistory() {
        configured(REPOSITORY).target("3").load().migrate();
        // Only the fixture is visible here, so V1-V3 must not be validated as missing.
        configured(LEGACY_V4).validateOnMigrate(false).load().migrate();
    }

    /** What the runbook's Flyway commands see; pending V5 alone must not fail validation. */
    private Flyway repository() {
        return configured(REPOSITORY).ignoreMigrationPatterns("*:pending").load();
    }

    private org.flywaydb.core.api.configuration.FluentConfiguration configured(String location) {
        return Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations(location);
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?",
                Integer.class, table);
        return count != null && count > 0;
    }
}
