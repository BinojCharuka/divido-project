package com.divido.controller;

import static com.divido.RealServerClient.setCookie;
import static com.divido.RealServerClient.value;
import static org.assertj.core.api.Assertions.assertThat;

import com.divido.RealServerClient;
import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Local plain-HTTP development (SESSION_COOKIE_SECURE=false): the cookies drop the
 * __Host- prefix and Secure, and keep every other protection.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = "server.servlet.session.cookie.secure=false")
@Import(TestcontainersConfiguration.class)
class AuthCookieLocalHttpIntegrationTest {

	private static final String PASSWORD = "correct-horse-battery";

	@LocalServerPort
	private int port;

	@Autowired
	private JdbcTemplate jdbc;

	@AfterEach
	void deleteUsers() {
		jdbc.update("DELETE FROM app_users");
	}

	@Test
	void localCookiesUseUnprefixedNamesWithoutSecure() throws Exception {
		var client = new RealServerClient(port, "DIVIDO_SESSION", "XSRF-TOKEN");

		String csrfCookie = setCookie(client.get("/api/v1/auth/csrf", null), "XSRF-TOKEN").orElseThrow();
		assertThat(csrfCookie).contains("Path=/").containsIgnoringCase("HttpOnly").contains("SameSite=Lax")
				.doesNotContainIgnoringCase("Secure").doesNotContainIgnoringCase("Domain=");

		assertThat(client.register("local@example.com", PASSWORD).statusCode()).isEqualTo(201);
		var login = client.login("local@example.com", PASSWORD, null);
		assertThat(login.statusCode()).isEqualTo(200);
		assertThat(login.headers().allValues("Set-Cookie")).noneMatch(c -> c.startsWith("__Host-"));
		String sessionCookie = setCookie(login, "DIVIDO_SESSION").orElseThrow();
		assertThat(sessionCookie).contains("Path=/").containsIgnoringCase("HttpOnly").contains("SameSite=Lax")
				.doesNotContainIgnoringCase("Secure").doesNotContainIgnoringCase("Domain=");
		String session = value(sessionCookie);

		var logout = client.postWithCsrf("/api/v1/auth/logout", null, session);
		assertThat(logout.statusCode()).isEqualTo(204);
		assertThat(setCookie(logout, "DIVIDO_SESSION").orElseThrow()).contains("Max-Age=0").containsIgnoringCase("HttpOnly");
		assertThat(setCookie(logout, "XSRF-TOKEN")).isPresent();
		assertThat(client.get("/api/v1/auth/me", session).statusCode()).isEqualTo(401);
	}
}
