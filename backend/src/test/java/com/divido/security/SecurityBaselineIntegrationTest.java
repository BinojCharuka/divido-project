package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.TestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
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
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Baseline for the current SecurityConfig (HTTP Basic, stateless). This documents
 * existing behavior only; it is not the approved session/CSRF design.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityBaselineIntegrationTest {

	/** Spring Boot's default username; no such account may exist. */
	private static final String INVALID_BASIC = basic("user", "arbitrary-password");

	@Autowired
	private MockMvcTester mvc;

	@Test
	void actuatorDiscoveryRequiresAuthentication() {
		// /actuator exists (endpoint discovery) but is not in the permitAll list.
		var result = mvc.get().uri("/actuator").exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).headers().hasHeaderSatisfying(HttpHeaders.WWW_AUTHENTICATE,
				values -> assertThat(values).anySatisfy(value -> assertThat(value).startsWith("Basic")));
	}

	@ParameterizedTest
	@ValueSource(strings = { "/actuator", "/actuator/health/db", "/actuator/env", "/api/v1/not-a-real-endpoint" })
	void protectedRoutesRejectAnonymousRequests(String uri) {
		assertThat(mvc.get().uri(uri).exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@ParameterizedTest
	@ValueSource(strings = { "/actuator", "/actuator/env", "/api/v1/not-a-real-endpoint" })
	void basicAuthAsDefaultUserIsRejectedCleanly(String uri) {
		var result = mvc.get().uri(uri).header(HttpHeaders.AUTHORIZATION, INVALID_BASIC).exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void registrationIsPublicForPostOnly() {
		assertThat(mvc.get().uri("/api/v1/auth/register").exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(mvc.put().uri("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}")
				.exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
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

	private static String basic(String username, String password) {
		String token = username + ":" + password;
		return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
	}
}
