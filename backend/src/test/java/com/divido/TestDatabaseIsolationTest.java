package com.divido;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.assertj.core.groups.Tuple;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfoService;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Verifies that tests run only against the disposable container. Assertions are
 * boolean-only so connection URLs are never printed on failure.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TestDatabaseIsolationTest {

	private static final String POISON_URL = "jdbc:postgresql://must-use-testcontainers.invalid:1/none";

	@Autowired
	private PostgreSQLContainer postgres;

	@Autowired
	private DataSource dataSource;

	@Autowired
	private Flyway flyway;

	@Autowired
	private Environment environment;

	@Test
	void dataSourceUsesTestContainer() throws SQLException {
		String url = connectionUrl(dataSource);

		assertThat(url.equals(postgres.getJdbcUrl())).as("DataSource must point at the test container").isTrue();
		assertThat(url.contains("neon.tech")).as("DataSource must not point at Neon").isFalse();
	}

	@Test
	void flywayUsesTestContainer() throws SQLException {
		String url = connectionUrl(flyway.getConfiguration().getDataSource());

		assertThat(url.equals(postgres.getJdbcUrl())).as("Flyway must point at the test container").isTrue();
		assertThat(url.contains("neon.tech")).as("Flyway must not point at Neon").isFalse();
	}

	@Test
	void sharedDatabasePlaceholderIsShadowed() {
		String configured = environment.getProperty("spring.datasource.url");

		assertThat(POISON_URL.equals(configured)).as("spring.datasource.url must be the test-only fail-safe value").isTrue();
	}

	/**
	 * Migrations already in a release, by script and checksum. A mismatch means an applied
	 * migration was edited, which is forbidden. Add to this list when a migration ships;
	 * the checks below do not need changing when a new migration file is added.
	 */
	private static final List<Tuple> RELEASED_MIGRATIONS = List.of(
			tuple("1", "V1__init.sql", 920031765),
			tuple("2", "V2__categories_and_income_sources.sql", -208851208),
			tuple("3", "V3__transactions.sql", -1778493884),
			tuple("4", "V4__monthly_budgets.sql", 1669268844),
			tuple("5", "V5__monthly_budgets.sql", 1608422391));

	@Test
	void everyRepositoryMigrationAppliedSuccessfully() {
		MigrationInfoService info = flyway.info();

		assertThat(info.pending()).as("no repository migration may be left pending").isEmpty();
		assertThat(info.all()).isNotEmpty();
		assertThat(info.all())
				.as("every migration on a clean database must succeed")
				.allSatisfy(migration -> assertThat(migration.getState()).isEqualTo(MigrationState.SUCCESS));
		assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
	}

	@Test
	void releasedMigrationsAreUnchangedAndInOrder() {
		List<Tuple> history = new JdbcTemplate(dataSource).query(
				"SELECT version, script, checksum FROM flyway_schema_history ORDER BY installed_rank",
				(row, rowNum) -> tuple(row.getString("version"), row.getString("script"), row.getInt("checksum")));

		assertThat(history).startsWith(RELEASED_MIGRATIONS.toArray(Tuple[]::new));
	}

	@Test
	void cleanDatabaseHasMonthlyBudgetsAndNoLegacyProductionObjects() {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);

		assertThat(jdbc.queryForObject(
				"SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'monthly_budgets'",
				Integer.class)).isEqualTo(11);
		assertThat(jdbc.queryForObject(
				"SELECT count(*) FROM pg_constraint WHERE conname = 'uq_monthly_budgets_user_month'",
				Integer.class)).isEqualTo(1);
		assertThat(jdbc.queryForObject(
				"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('budgets', 'monthly_reflections')",
				Integer.class)).as("legacy objects exist only in production's history").isZero();
	}

	private static String connectionUrl(DataSource source) throws SQLException {
		try (Connection connection = source.getConnection()) {
			return connection.getMetaData().getURL();
		}
	}

}
