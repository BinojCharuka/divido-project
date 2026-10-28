package com.divido.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Login, current user, logout and CSRF against the real security filter chain.
 * Cookie attributes on a real server are covered by AuthCookieIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ExtendWith(OutputCaptureExtension.class)
class AuthSessionIntegrationTest {

	private static final String PASSWORD = "correct-horse-battery";

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@AfterEach
	void deleteUsers() {
		jdbc.update("DELETE FROM app_users");
	}

	@Test
	void validCredentialsSignIn() {
		String id = registerUser("person@example.com");

		var result = login("person@example.com", PASSWORD);

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("user");
		assertThat(result).bodyJson().extractingPath("$.user").asMap()
				.containsOnlyKeys("id", "email", "onboardingComplete");
		assertThat(result).bodyJson().extractingPath("$.user.id").isEqualTo(id);
		assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo("person@example.com");
		assertThat(result).bodyJson().extractingPath("$.user.onboardingComplete").isEqualTo(false);
		assertThat(session(result)).isNotNull();
	}

	@Test
	void loginNormalizesEmailLikeRegistration() {
		registerUser("  Mixed.Case@Example.COM ");

		var result = login(" MIXED.case@example.com  ", PASSWORD);

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo("mixed.case@example.com");
	}

	@Test
	void responseNeverContainsThePasswordOrHash() {
		registerUser("hash@example.com");
		String stored = jdbc.queryForObject("SELECT password_hash FROM app_users", String.class);

		String raw = body(login("hash@example.com", PASSWORD));

		assertThat(raw).doesNotContain(PASSWORD).doesNotContain(stored).doesNotContainIgnoringCase("password");
	}

	@Test
	void wrongPasswordAndUnknownEmailGetTheSameNeutral401() {
		registerUser("known@example.com");

		var wrongPassword = login("known@example.com", "wrong-password-123");
		var unknownEmail = login("unknown@example.com", PASSWORD);

		for (var result : List.of(wrongPassword, unknownEmail)) {
			assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
			assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("status", "code", "message");
			assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("INVALID_CREDENTIALS");
			assertThat(result).bodyJson().extractingPath("$.message").isEqualTo("The email or password is incorrect.");
			assertThat(result).doesNotContainHeader(HttpHeaders.WWW_AUTHENTICATE);
			assertThat(session(result)).isNull();
		}
		assertThat(body(wrongPassword)).isEqualTo(body(unknownEmail));
	}

	@Test
	void passwordLongerThanBcryptAcceptsIsANeutral401() {
		registerUser("long@example.com");

		var result = login("long@example.com", "é".repeat(40));

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("INVALID_CREDENTIALS");
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("invalidLoginBodies")
	void invalidLoginBodiesFollowTheErrorConventions(String description, String json, String code) {
		var result = postWithCsrf("/api/v1/auth/login", json, null);

		assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo(code);
		assertThat(session(result)).isNull();
	}

	static Stream<Arguments> invalidLoginBodies() {
		return Stream.of(
				Arguments.of("missing fields", "{}", "VALIDATION_ERROR"),
				Arguments.of("invalid email", "{\"email\":\"not-an-email\",\"password\":\"x\"}", "VALIDATION_ERROR"),
				Arguments.of("NUL in email", "{\"email\":\"a\\u0000@example.com\",\"password\":\"x\"}", "VALIDATION_ERROR"),
				Arguments.of("blank password", "{\"email\":\"a@example.com\",\"password\":\"  \"}", "VALIDATION_ERROR"),
				Arguments.of("malformed JSON", "{\"email\":", "MALFORMED_REQUEST"));
	}

	@Test
	void loginRequiresACsrfToken() {
		registerUser("csrf@example.com");

		var result = mvc.post().uri("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(credentials("csrf@example.com", PASSWORD)).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(session(result)).isNull();
	}

	@Test
	void loginRotatesAnExistingSessionId() {
		registerUser("rotate@example.com");
		MockHttpSession session = session(login("rotate@example.com", PASSWORD));
		String firstId = session.getId();

		var again = postWithCsrf("/api/v1/auth/login", credentials("rotate@example.com", PASSWORD), session);

		assertThat(again).hasStatus(HttpStatus.OK);
		assertThat(session(again).getId()).isNotEqualTo(firstId);
	}

	@Test
	void loginClearsThePreLoginCsrfToken() {
		registerUser("rotate-csrf@example.com");

		var result = login("rotate-csrf@example.com", PASSWORD);

		assertThat(result.getResponse().getCookie(CsrfSupport.COOKIE_NAME)).isNotNull()
				.satisfies(cookie -> assertThat(cookie.getMaxAge()).isZero());
	}

	@Test
	void meReturnsTheSessionUser() {
		String id = registerUser("me@example.com");
		MockHttpSession session = session(login("me@example.com", PASSWORD));

		var result = mvc.get().uri("/api/v1/auth/me").session(session).exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$.user").asMap()
				.containsOnlyKeys("id", "email", "onboardingComplete");
		assertThat(result).bodyJson().extractingPath("$.user.id").isEqualTo(id);
		assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo("me@example.com");
		assertThat(body(result)).doesNotContainIgnoringCase("password");
	}

	@Test
	void meWithoutASessionIs401WithoutABasicChallenge() {
		var result = mvc.get().uri("/api/v1/auth/me").exchange();

		assertUnauthenticated(result);
	}

	@Test
	void meWithAnExpiredSessionIs401() {
		registerUser("expired@example.com");
		MockHttpSession session = session(login("expired@example.com", PASSWORD));
		// What the server sees once the idle timeout has removed the session.
		session.invalidate();

		assertUnauthenticated(mvc.get().uri("/api/v1/auth/me").session(session).exchange());
	}

	@Test
	void meIgnoresUserIdsSuppliedInTheRequest() {
		String aliceId = registerUser("alice@example.com");
		String bobId = registerUser("bob@example.com");
		MockHttpSession alice = session(login("alice@example.com", PASSWORD));

		var result = mvc.get().uri("/api/v1/auth/me?id={id}&userId={id}&email=bob@example.com", bobId, bobId)
				.header("X-User-Id", bobId).session(alice).exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$.user.id").isEqualTo(aliceId);
		assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo("alice@example.com");
	}

	@Test
	void aNewlyRegisteredUserIsNotSignedIn() {
		var registration = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(registration("fresh@example.com")).exchange();
		assertThat(registration).hasStatus(HttpStatus.CREATED);
		assertThat(session(registration)).isNull();

		assertUnauthenticated(mvc.get().uri("/api/v1/auth/me").exchange());
	}

	@Test
	void logoutInvalidatesTheSession() {
		registerUser("logout@example.com");
		MockHttpSession session = session(login("logout@example.com", PASSWORD));

		var result = postWithCsrf("/api/v1/auth/logout", null, session);

		assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
		assertThat(result.getResponse().getContentLength()).isZero();
		assertThat(session.isInvalid()).isTrue();
		assertThat(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
				.anySatisfy(cookie -> assertThat(cookie).startsWith("__Host-DIVIDO_SESSION=;").contains("Max-Age=0"))
				.anySatisfy(cookie -> assertThat(cookie).startsWith("__Host-XSRF-TOKEN=;").contains("Max-Age=0"));
		assertUnauthenticated(mvc.get().uri("/api/v1/auth/me").session(session).exchange());
	}

	@Test
	void logoutWithoutACsrfTokenIsRejectedAndKeepsTheSession() {
		registerUser("logout-csrf@example.com");
		MockHttpSession session = session(login("logout-csrf@example.com", PASSWORD));

		var result = mvc.post().uri("/api/v1/auth/logout").session(session).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(mvc.get().uri("/api/v1/auth/me").session(session).exchange()).hasStatus(HttpStatus.OK);
	}

	@Test
	void logoutWithAWrongCsrfTokenIsRejected() {
		registerUser("logout-bad@example.com");
		MockHttpSession session = session(login("logout-bad@example.com", PASSWORD));
		CsrfSupport csrf = CsrfSupport.fetch(mvc);

		var result = mvc.post().uri("/api/v1/auth/logout").session(session).header(csrf.headerName(), "forged")
				.cookie(csrf.cookie()).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(session.isInvalid()).isFalse();
	}

	@Test
	void aMaskedTokenOnlyMatchesItsOwnCookie() {
		registerUser("mismatch@example.com");
		MockHttpSession session = session(login("mismatch@example.com", PASSWORD));
		CsrfSupport mine = CsrfSupport.fetch(mvc);
		CsrfSupport other = CsrfSupport.fetch(mvc);

		var result = mvc.post().uri("/api/v1/auth/logout").session(session).header(mine.headerName(), mine.token())
				.cookie(other.cookie()).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(session.isInvalid()).isFalse();
	}

	@Test
	void theRawCookieValueIsNotAcceptedAsTheHeaderToken() {
		registerUser("raw@example.com");
		MockHttpSession session = session(login("raw@example.com", PASSWORD));
		CsrfSupport csrf = CsrfSupport.fetch(mvc);

		var result = mvc.post().uri("/api/v1/auth/logout").session(session).header(csrf.headerName(), csrf.cookieValue())
				.cookie(csrf.cookie()).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(session.isInvalid()).isFalse();
	}

	/**
	 * Cookie tossing: an attacker who can plant the CSRF cookie knows its raw value and
	 * can mask it. Sent in the header (which a cross-site form cannot do) it would pass;
	 * as a {@code _csrf} form parameter it must not.
	 */
	@Test
	void aCsrfFormParameterNeverAuthorizesARequest() {
		registerUser("toss@example.com");
		MockHttpSession session = session(login("toss@example.com", PASSWORD));
		String planted = "attacker-chosen-token";
		String masked = mask(planted);

		var formLogout = mvc.post().uri("/api/v1/auth/logout").session(session)
				.cookie(new Cookie(CsrfSupport.COOKIE_NAME, planted))
				.contentType(MediaType.APPLICATION_FORM_URLENCODED).param("_csrf", masked).exchange();
		assertThat(formLogout).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(formLogout).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(session.isInvalid()).isFalse();

		// Even the server's own valid token is refused when it arrives as a parameter.
		CsrfSupport real = CsrfSupport.fetch(mvc);
		var realTokenAsParameter = mvc.post().uri("/api/v1/auth/logout").session(session).cookie(real.cookie())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED).param("_csrf", real.token()).exchange();
		assertThat(realTokenAsParameter).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(session.isInvalid()).isFalse();

		var formRegister = mvc.post().uri("/api/v1/auth/register").cookie(new Cookie(CsrfSupport.COOKIE_NAME, planted))
				.contentType(MediaType.APPLICATION_FORM_URLENCODED).param("_csrf", masked)
				.param("email", "victim@example.com").param("password", PASSWORD).param("displayName", "V").exchange();
		assertThat(formRegister).hasStatus(HttpStatus.FORBIDDEN);

		// Control: the same masked token in the header is valid, so the parameter path is what is refused.
		var header = mvc.post().uri("/api/v1/auth/logout").session(session)
				.cookie(new Cookie(CsrfSupport.COOKIE_NAME, planted)).header("X-XSRF-TOKEN", masked).exchange();
		assertThat(header).hasStatus(HttpStatus.NO_CONTENT);
	}

	@Test
	void logoutRequiresASession() {
		assertUnauthenticated(postWithCsrf("/api/v1/auth/logout", null, null));
	}

	@Test
	void csrfBootstrapReturnsAUsableToken() {
		var result = mvc.get().uri("/api/v1/auth/csrf").exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("headerName", "token");
		assertThat(result).bodyJson().extractingPath("$.headerName").isEqualTo("X-XSRF-TOKEN");
		String token = JsonPath.read(body(result), "$.token");
		assertThat(token).isNotBlank();
		// The body carries the masked token, never the raw cookie value.
		String raw = result.getResponse().getCookie(CsrfSupport.COOKIE_NAME).getValue();
		assertThat(token).isNotEqualTo(raw).doesNotContain(raw);
		assertThat(result.getResponse().getHeader(HttpHeaders.CACHE_CONTROL)).contains("no-store");
		// The bootstrap call does not create a session or reveal anything about users.
		assertThat(session(result)).isNull();
		assertThat(body(result)).doesNotContainIgnoringCase("session").doesNotContainIgnoringCase("user");
	}

	@Test
	void eachBootstrapCallMasksTheSameCookieTokenDifferently() {
		CsrfSupport first = CsrfSupport.fetch(mvc);

		var result = mvc.get().uri("/api/v1/auth/csrf").cookie(first.cookie()).exchange();
		String second = JsonPath.read(body(result), "$.token");

		assertThat(result.getResponse().getCookie(CsrfSupport.COOKIE_NAME)).isNull();
		assertThat(second).isNotEqualTo(first.token());
		var withSecond = mvc.post().uri("/api/v1/auth/register").cookie(first.cookie()).header("X-XSRF-TOKEN", second)
				.contentType(MediaType.APPLICATION_JSON).content(registration("second-mask@example.com")).exchange();
		assertThat(withSecond).hasStatus(HttpStatus.CREATED);
	}

	@Test
	void safeRequestsDoNotNeedACsrfHeader() {
		registerUser("safe@example.com");
		MockHttpSession session = session(login("safe@example.com", PASSWORD));

		assertThat(mvc.get().uri("/api/v1/auth/me").session(session).exchange()).hasStatus(HttpStatus.OK);
		assertThat(mvc.get().uri("/api/v1/health").exchange()).hasStatus(HttpStatus.OK);
	}

	@Test
	void failedAndSuccessfulLoginsDoNotLogCredentials(CapturedOutput output) {
		String email = "log-check-91c2@example.com";
		registerUser(email);
		int before = output.getAll().length();

		login(email, "wrong-password-4d8e");
		login("unknown-5b7a@example.com", PASSWORD);
		login(email.toUpperCase(), PASSWORD);

		String logged = output.getAll().substring(before);
		assertThat(logged).doesNotContainIgnoringCase(email).doesNotContainIgnoringCase("unknown-5b7a")
				.doesNotContain("wrong-password-4d8e").doesNotContain(PASSWORD);
	}

	private static void assertUnauthenticated(MvcTestResult result) {
		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).doesNotContainHeader(HttpHeaders.WWW_AUTHENTICATE);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo(401);
	}

	/** Registers through the API and returns the new user ID. */
	private String registerUser(String email) {
		var result = postWithCsrf("/api/v1/auth/register", registration(email), null);
		assertThat(result).hasStatus(HttpStatus.CREATED);
		return JsonPath.read(body(result), "$.user.id");
	}

	private MvcTestResult login(String email, String password) {
		return postWithCsrf("/api/v1/auth/login", credentials(email, password), null);
	}

	private MvcTestResult postWithCsrf(String uri, String json, MockHttpSession session) {
		var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri(uri));
		if (session != null) {
			// As a browser would: the request names the session through its cookie.
			request.session(session).with(r -> {
				r.setRequestedSessionId(session.getId());
				r.setRequestedSessionIdValid(true);
				return r;
			});
		}
		if (json != null) {
			request.contentType(MediaType.APPLICATION_JSON).content(json);
		}
		return request.exchange();
	}

	/** Spring Security's XOR masking: random bytes, then random XOR token, Base64url. */
	private static String mask(String rawToken) {
		byte[] token = rawToken.getBytes(StandardCharsets.UTF_8);
		byte[] random = new byte[token.length];
		new SecureRandom().nextBytes(random);
		byte[] combined = new byte[token.length * 2];
		for (int i = 0; i < token.length; i++) {
			combined[i] = random[i];
			combined[token.length + i] = (byte) (random[i] ^ token[i]);
		}
		return Base64.getUrlEncoder().encodeToString(combined);
	}

	private static MockHttpSession session(MvcTestResult result) {
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	private static String body(MvcTestResult result) {
		return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
	}

	private static String credentials(String email, String password) {
		return "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
	}

	private static String registration(String email) {
		return "{\"email\":\"%s\",\"password\":\"%s\",\"displayName\":\"Test User\"}".formatted(email, PASSWORD);
	}
}
