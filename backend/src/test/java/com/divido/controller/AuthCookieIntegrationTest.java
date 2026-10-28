package com.divido.controller;

import static com.divido.RealServerClient.setCookie;
import static com.divido.RealServerClient.value;
import static org.assertj.core.api.Assertions.assertThat;

import com.divido.RealServerClient;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Cookie attributes, session rotation and logout as a browser sees them, against
 * the embedded Tomcat server, with the default (production) cookie settings.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ExtendWith(OutputCaptureExtension.class)
class AuthCookieIntegrationTest {

	private static final String PASSWORD = "correct-horse-battery";
	private static final String SESSION = "__Host-DIVIDO_SESSION";
	private static final String CSRF = "__Host-XSRF-TOKEN";

	@LocalServerPort
	private int port;

	@Autowired
	private JdbcTemplate jdbc;

	private RealServerClient client;

	@BeforeEach
	void client() {
		client = new RealServerClient(port, SESSION, CSRF);
	}

	@AfterEach
	void deleteUsers() {
		jdbc.update("DELETE FROM app_users");
	}

	@Test
	void csrfCookieIsAHostOnlySecureHttpOnlyCookie() throws Exception {
		var response = client.get("/api/v1/auth/csrf", null);

		String cookie = setCookie(response, CSRF).orElseThrow();
		assertHostPrefixAttributes(cookie);
		assertThat(cookie).containsIgnoringCase("HttpOnly").contains("SameSite=Lax");
		// The body holds the masked token, not the raw cookie value.
		assertThat((String) JsonPath.read(response.body(), "$.token")).isNotEqualTo(value(cookie));
		assertThat(response.headers().allValues("Set-Cookie")).noneMatch(c -> c.startsWith("XSRF-TOKEN="));
	}

	@Test
	void sessionLifecycleUsesHostPrefixedRotatedCookies(CapturedOutput output) throws Exception {
		assertThat(client.register("cookie@example.com", PASSWORD).statusCode()).isEqualTo(201);

		var firstLogin = client.login("cookie@example.com", PASSWORD, null);
		assertThat(firstLogin.statusCode()).isEqualTo(200);
		String firstCookie = setCookie(firstLogin, SESSION).orElseThrow();
		assertHostPrefixAttributes(firstCookie);
		assertThat(firstCookie).containsIgnoringCase("HttpOnly").contains("SameSite=Lax");
		assertThat(firstLogin.headers().allValues("Set-Cookie")).noneMatch(c -> c.startsWith("DIVIDO_SESSION="));
		String first = value(firstCookie);
		assertThat(client.get("/api/v1/auth/me", first).statusCode()).isEqualTo(200);

		// Signing in again on the same session issues a new ID; the old one stops working.
		var secondLogin = client.login("cookie@example.com", PASSWORD, first);
		String second = value(setCookie(secondLogin, SESSION).orElseThrow());
		assertThat(second).isNotEqualTo(first);
		assertThat(client.get("/api/v1/auth/me", first).statusCode()).isEqualTo(401);
		assertThat(client.get("/api/v1/auth/me", second).statusCode()).isEqualTo(200);

		// Logout expires both cookies with matching attributes and kills the session.
		var logout = client.postWithCsrf("/api/v1/auth/logout", null, second);
		assertThat(logout.statusCode()).isEqualTo(204);
		String clearedSession = setCookie(logout, SESSION).orElseThrow();
		assertThat(value(clearedSession)).isEmpty();
		assertThat(clearedSession).contains("Max-Age=0").containsIgnoringCase("HttpOnly").contains("SameSite=Lax");
		assertHostPrefixAttributes(clearedSession);
		String clearedCsrf = setCookie(logout, CSRF).orElseThrow();
		assertThat(value(clearedCsrf)).isEmpty();
		assertThat(clearedCsrf).contains("Expires=Thu, 01 Jan 1970");
		assertHostPrefixAttributes(clearedCsrf);

		var reuse = client.get("/api/v1/auth/me", second);
		assertThat(reuse.statusCode()).isEqualTo(401);
		assertThat(reuse.headers().firstValue("WWW-Authenticate")).isEmpty();
		assertThat((String) JsonPath.read(reuse.body(), "$.code")).isEqualTo("UNAUTHENTICATED");

		assertThat(output.getAll()).doesNotContain(first).doesNotContain(second).doesNotContain(PASSWORD)
				.doesNotContainIgnoringCase("cookie@example.com");
	}

	@Test
	void unknownSessionIdIsUnauthenticated() throws Exception {
		var response = client.get("/api/v1/auth/me", "0123456789ABCDEF0123456789ABCDEF");

		assertThat(response.statusCode()).isEqualTo(401);
		assertThat(response.headers().firstValue("WWW-Authenticate")).isEmpty();
	}

	@Test
	void anonymousRequestsDoNotCreateSessions() throws Exception {
		var protectedRoute = client.get("/api/v1/auth/me", null);
		var health = client.get("/api/v1/health", null);
		var csrf = client.get("/api/v1/auth/csrf", null);
		var registration = client.register("anonymous@example.com", PASSWORD);
		assertThat(registration.statusCode()).isEqualTo(201);

		for (var response : List.of(protectedRoute, health, csrf, registration)) {
			assertThat(response.headers().allValues("Set-Cookie")).noneMatch(c -> c.contains("DIVIDO_SESSION"));
		}
		assertThat(protectedRoute.statusCode()).isEqualTo(401);
		assertThat(protectedRoute.headers().firstValue("WWW-Authenticate")).isEmpty();
	}

	/** What browsers require of a __Host- cookie: Secure, Path=/ and no Domain. */
	private static void assertHostPrefixAttributes(String setCookie) {
		assertThat(setCookie).startsWith("__Host-").containsPattern("; Path=/(;|$)").containsIgnoringCase("; Secure")
				.doesNotContainIgnoringCase("Domain=");
	}
}
