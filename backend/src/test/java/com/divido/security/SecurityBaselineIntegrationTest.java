package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Route-level baseline for the session-cookie SecurityConfig: only the intended
 * routes are public, nothing else is, and HTTP Basic is not an authentication
 * mechanism.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityBaselineIntegrationTest {

	/** Spring Boot's default username; no such account may exist. */
	private static final String INVALID_BASIC = basic("user", "arbitrary-password");

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@AfterEach
	void deleteUsers() {
		jdbc.update("DELETE FROM app_users");
	}

	@ParameterizedTest
	@ValueSource(strings = { "/actuator", "/actuator/health/db", "/actuator/env", "/api/v1/not-a-real-endpoint",
			"/api/v1/auth/me", "/api/v1/auth/login", "/api/v1/auth/register" })
	void protectedRoutesRejectAnonymousRequestsWithoutAChallenge(String uri) {
		var result = mvc.get().uri(uri).exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).doesNotContainHeader(HttpHeaders.WWW_AUTHENTICATE);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
	}

	@ParameterizedTest
	@ValueSource(strings = { "/actuator", "/actuator/env", "/api/v1/not-a-real-endpoint", "/api/v1/auth/me" })
	void basicAuthAsDefaultUserIsRejectedCleanly(String uri) {
		var result = mvc.get().uri(uri).header(HttpHeaders.AUTHORIZATION, INVALID_BASIC).exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).doesNotContainHeader(HttpHeaders.WWW_AUTHENTICATE);
	}

	@Test
	void basicAuthIsNotAcceptedEvenWithAValidAccount() {
		var registration = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"basic@example.com\",\"password\":\"correct-horse-battery\",\"displayName\":\"B\"}")
				.exchange();
		assertThat(registration).hasStatus(HttpStatus.CREATED);

		var result = mvc.get().uri("/api/v1/auth/me")
				.header(HttpHeaders.AUTHORIZATION, basic("basic@example.com", "correct-horse-battery")).exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).doesNotContainHeader(HttpHeaders.WWW_AUTHENTICATE);
	}

	@Test
	void stateChangingRequestsNeedACsrfTokenBeforeAuthorization() {
		var withoutToken = mvc.put().uri("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{}").exchange();
		assertThat(withoutToken).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(withoutToken).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");

		var withToken = CsrfSupport.fetch(mvc).apply(mvc.put().uri("/api/v1/auth/register"))
				.contentType(MediaType.APPLICATION_JSON).content("{}").exchange();
		assertThat(withToken).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void healthIgnoresInvalidBasicCredentials() {
		var result = mvc.get().uri("/api/v1/health").header(HttpHeaders.AUTHORIZATION, INVALID_BASIC).exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("status");
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo("UP");
	}

	@Test
	void actuatorHealthIsPublicWithoutDetails() {
		var result = mvc.get().uri("/actuator/health").exchange();

		// show-details: never. Probe group names (liveness/readiness) may be listed; component data may not.
		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$").asMap().doesNotContainKeys("components", "details");
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo("UP");
	}

	@Test
	void noCrossOriginAccessIsConfiguredByDefault() {
		var result = mvc.get().uri("/api/v1/health").header(HttpHeaders.ORIGIN, "https://evil.example").exchange();

		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS);
	}

	private static String basic(String username, String password) {
		String token = username + ":" + password;
		return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
	}
}
