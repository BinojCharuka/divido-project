package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.divido.TestcontainersConfiguration;
import java.util.List;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/** Credentialed CORS is allowed only for the exact configured origins. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = "divido.cors.allowed-origins=http://localhost:3000")
class CorsConfigurationIntegrationTest {

	private static final String ALLOWED = "http://localhost:3000";

	@Autowired
	private MockMvcTester mvc;

	@Test
	void preflightFromTheAllowedOriginSucceedsWithCredentials() {
		var result = preflight(ALLOWED);

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED);
		assertThat(result).hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
		assertThat(result.getResponse().getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS))
				.containsIgnoringCase("X-XSRF-TOKEN");
	}

	@Test
	void otherOriginsAreNotReflected() {
		var result = preflight("https://evil.example");

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
	}

	@Test
	void simpleRequestFromTheAllowedOriginGetsCorsHeaders() {
		var result = mvc.get().uri("/api/v1/health").header(HttpHeaders.ORIGIN, ALLOWED).exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED);
	}

	@Test
	void disallowedOriginsGetNoPermissiveHeadersOnCredentialedRequests() {
		var result = mvc.get().uri("/api/v1/auth/me").header(HttpHeaders.ORIGIN, "https://evil.example")
				.cookie(new Cookie("__Host-DIVIDO_SESSION", "any")).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS);
	}

	@Test
	void corsIsNotAppliedOutsideTheApi() {
		var result = mvc.get().uri("/actuator/health").header(HttpHeaders.ORIGIN, ALLOWED).exchange();

		assertThat(result).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
	}

	@ParameterizedTest
	@ValueSource(strings = { "null", "*", "https://*.example.com", "localhost:3000", "app.example.com",
			"http://localhost:3000/", "https://app.example.com/path", "https://user@app.example.com",
			"https://app.example.com?x=1", "ftp://app.example.com", "http://", "https://app.example.com:99999x", "https://app.example.com:99999" })
	void malformedOriginsAreRefusedAtStartup(String origin) {
		assertThatThrownBy(() -> SecurityConfig.validatedOrigins(List.of("http://localhost:3000", origin)))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void exactOriginsAreAccepted() {
		assertThat(SecurityConfig.validatedOrigins(List.of(" http://localhost:3000 ", "https://app.example.com",
				"https://app.example.com:8443", "")))
				.containsExactly("http://localhost:3000", "https://app.example.com", "https://app.example.com:8443");
	}

	private MvcTestResult preflight(String origin) {
		return mvc.options().uri("/api/v1/auth/login").header(HttpHeaders.ORIGIN, origin)
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,x-xsrf-token").exchange();
	}
}
