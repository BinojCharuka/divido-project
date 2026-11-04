package com.divido;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
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

	@Test
	void containerHasV1ToV4Applied() {
		List<Map<String, Object>> history = new JdbcTemplate(dataSource).queryForList(
				"SELECT version, script, checksum, success FROM flyway_schema_history ORDER BY installed_rank");

		assertThat(history).hasSize(4);
		assertThat(history.get(0))
				.containsEntry("version", "1")
				.containsEntry("script", "V1__init.sql")
				.containsEntry("checksum", 920031765)
				.containsEntry("success", true);
		assertThat(history.get(1))
				.containsEntry("version", "2")
				.containsEntry("script", "V2__categories_and_income_sources.sql")
				.containsEntry("success", true);
		assertThat(history.get(2))
				.containsEntry("version", "3")
				.containsEntry("script", "V3__transactions.sql")
				.containsEntry("success", true);
		assertThat(history.get(3))
				.containsEntry("version", "4")
				.containsEntry("script", "V4__monthly_budgets.sql")
				.containsEntry("success", true);
	}

	private static String connectionUrl(DataSource source) throws SQLException {
		try (Connection connection = source.getConnection()) {
			return connection.getMetaData().getURL();
		}
	}

}
