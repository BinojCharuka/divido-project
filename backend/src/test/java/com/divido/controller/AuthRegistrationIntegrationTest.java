package com.divido.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ExtendWith(OutputCaptureExtension.class)
class AuthRegistrationIntegrationTest {

	private static final String PASSWORD = "correct-horse-battery";

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@AfterEach
	void deleteUsers() {
		jdbc.update("DELETE FROM app_users");
	}

	@Test
	void registersUserWithoutAuthentication() throws Exception {
		var result = register(body("  Person@Example.COM ", PASSWORD, "  Sample User  "));

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(result).hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON);
		assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo("person@example.com");
		assertThat(result).bodyJson().extractingPath("$.user.onboardingComplete").isEqualTo(false);
		String id = JsonPath.read(result.getResponse().getContentAsString(), "$.user.id");

		Map<String, Object> row = jdbc.queryForMap("SELECT * FROM app_users WHERE id = ?::uuid", id);
		assertThat(row.get("email")).isEqualTo("person@example.com");
		assertThat(row.get("display_name")).isEqualTo("Sample User");
		assertThat(row.get("currency")).isEqualTo("LKR");
		assertThat(row.get("timezone")).isEqualTo("Asia/Colombo");
		assertThat(row.get("created_at")).isNotNull();
		assertThat(row.get("updated_at")).isNotNull();
	}

	@Test
	void invalidBasicCredentialsDoNotBlockRegistration() {
		String invalidBasic = "Basic " + Base64.getEncoder()
				.encodeToString("user:arbitrary-password".getBytes(StandardCharsets.UTF_8));
		var result = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"))
				.header(HttpHeaders.AUTHORIZATION, invalidBasic)
				.contentType(MediaType.APPLICATION_JSON).content(body("basic@example.com", PASSWORD, "Basic Header"))
				.exchange();

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(userCount()).isEqualTo(1);
	}

	@Test
	void storesOnlyABcryptHashOfThePassword() {
		assertThat(register(body("hash@example.com", PASSWORD, "Hash Check"))).hasStatus(HttpStatus.CREATED);

		String stored = jdbc.queryForObject("SELECT password_hash FROM app_users WHERE email = ?", String.class,
				"hash@example.com");
		assertThat(stored).isNotEqualTo(PASSWORD).doesNotContain(PASSWORD).startsWith("{bcrypt}$2");
		assertThat(passwordEncoder.matches(PASSWORD, stored)).isTrue();
	}

	@Test
	void responseExposesOnlyPublicUserFields() throws Exception {
		var result = register(body("public@example.com", PASSWORD, "Public Fields"));
		String stored = jdbc.queryForObject("SELECT password_hash FROM app_users WHERE email = ?", String.class,
				"public@example.com");

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(result).bodyJson().extractingPath("$.user").asMap()
				.containsOnlyKeys("id", "email", "displayName", "onboardingComplete");
		assertThat(result).bodyJson().extractingPath("$.user.displayName").isEqualTo("Public Fields");
		assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("user");
		String raw = result.getResponse().getContentAsString();
		assertThat(raw).doesNotContain(PASSWORD).doesNotContain(stored).doesNotContainIgnoringCase("password");
	}

	@Test
	void ignoresClientSuppliedUserId() {
		UUID clientId = UUID.fromString("00000000-0000-0000-0000-000000000001");
		var result = register("""
				{"id":"%s","email":"id@example.com","password":"%s","displayName":"Id Check"}
				""".formatted(clientId, PASSWORD));

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(result).bodyJson().extractingPath("$.user.id").isNotEqualTo(clientId.toString());
		assertThat(jdbc.queryForObject("SELECT count(*) FROM app_users WHERE id = ?", Integer.class, clientId))
				.isZero();
	}

	@Test
	void registrationRequiresACsrfToken() {
		var result = mvc.post().uri("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(body("nocsrf@example.com", PASSWORD, "No Token")).exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(userCount()).isZero();
	}

	@Test
	void registrationRejectsAMismatchedCsrfToken() {
		CsrfSupport csrf = CsrfSupport.fetch(mvc);
		var result = mvc.post().uri("/api/v1/auth/register").header(csrf.headerName(), "not-the-cookie-token")
				.cookie(csrf.cookie())
				.contentType(MediaType.APPLICATION_JSON).content(body("badcsrf@example.com", PASSWORD, "Bad Token"))
				.exchange();

		assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
		assertThat(userCount()).isZero();
	}

	/** DEC-025: registration creates the account only; it never signs the user in. */
	@Test
	void registrationDoesNotCreateASession() {
		var result = register(body("nosession@example.com", PASSWORD, "No Session"));

		assertThat(result).hasStatus(HttpStatus.CREATED);
		assertThat(result.getRequest().getSession(false)).isNull();
		assertThat(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE)).noneMatch(c -> c.contains("DIVIDO_SESSION"));
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("invalidBodies")
	void rejectsInvalidField(String description, String json, String field) {
		var result = register(json);

		assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo(400);
		assertThat(result).bodyJson().extractingPath("$.fieldErrors").asMap().containsKey(field);
		assertThat(userCount()).isZero();
	}

	static Stream<Arguments> invalidBodies() {
		return Stream.of(
				Arguments.of("missing email", "{\"password\":\"%s\",\"displayName\":\"A\"}".formatted(PASSWORD), "email"),
				Arguments.of("invalid email", body("not-an-email", PASSWORD, "A"), "email"),
				Arguments.of("email over 255", body("a".repeat(250) + "@example.com", PASSWORD, "A"), "email"),
				Arguments.of("missing password", "{\"email\":\"a@example.com\",\"displayName\":\"A\"}", "password"),
				Arguments.of("password under 8", body("a@example.com", "short7!", "A"), "password"),
				Arguments.of("password over 72 chars", body("a@example.com", "p".repeat(73), "A"), "password"),
				Arguments.of("password over 72 UTF-8 bytes", body("a@example.com", "é".repeat(40), "A"), "password"),
				Arguments.of("missing displayName", "{\"email\":\"a@example.com\",\"password\":\"%s\"}".formatted(PASSWORD),
						"displayName"),
				Arguments.of("blank displayName", body("a@example.com", PASSWORD, "   "), "displayName"),
				Arguments.of("displayName over 100", body("a@example.com", PASSWORD, "d".repeat(101)), "displayName"),
				Arguments.of("displayName with NUL character", body("a@example.com", PASSWORD, "A\\u0000B"), "displayName"));
	}

	@Test
	void reportsEveryMissingField() {
		var result = register("{}");

		assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(result).bodyJson().extractingPath("$.fieldErrors").asMap()
				.containsOnlyKeys("email", "password", "displayName");
	}

	@Test
	void rejectsMalformedJson() {
		var result = register("{\"email\":");

		assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("MALFORMED_REQUEST");
		assertThat(userCount()).isZero();
	}

	@Test
	void rejectsDuplicateEmailIgnoringCaseAndWhitespace() {
		assertThat(register(body("dup@example.com", PASSWORD, "First"))).hasStatus(HttpStatus.CREATED);

		var result = register(body(" DUP@Example.com ", "another-password", "Second"));

		assertNeutralConflict(result, "dup@example.com");
		assertThat(userCount()).isEqualTo(1);
		assertThat(jdbc.queryForObject("SELECT display_name FROM app_users", String.class)).isEqualTo("First");
	}

	@Test
	void duplicateRegistrationDoesNotLogTheEmail(CapturedOutput output) {
		String email = "leak-check-7f3a@example.com";
		assertThat(register(body(email, PASSWORD, "First"))).hasStatus(HttpStatus.CREATED);
		int before = output.getAll().length();

		var result = register(body(email.toUpperCase(), PASSWORD, "Second"));

		assertNeutralConflict(result, email);
		assertThat(userCount()).isEqualTo(1);
		String logged = output.getAll().substring(before);
		assertThat(logged).doesNotContainIgnoringCase(email).doesNotContain(PASSWORD);
	}

	/** DEC-022: 409 with a neutral code and message that never names the submitted email. */
	private static void assertNeutralConflict(MvcTestResult result, String email) {
		assertThat(result).hasStatus(HttpStatus.CONFLICT);
		assertThat(result).bodyJson().extractingPath("$").asMap().containsOnlyKeys("status", "code", "message");
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo(409);
		assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("REGISTRATION_CONFLICT");
		assertThat(result).bodyJson().extractingPath("$.message")
				.isEqualTo("We couldn't create an account with these details.");
		assertThat(result).bodyText().doesNotContainIgnoringCase(email);
	}

	/**
	 * Documents the V1 constraint the duplicate check relies on: exact duplicates are
	 * rejected, but the constraint itself is case-sensitive, so case-insensitive
	 * uniqueness holds only because the API stores lower-cased emails.
	 */
	@Test
	void databaseEmailConstraintIsUniqueButCaseSensitive() {
		String constraint = jdbc.queryForObject("""
				SELECT conname FROM pg_constraint
				WHERE conrelid = 'app_users'::regclass AND contype = 'u'
				""", String.class);
		assertThat(constraint).isEqualTo("app_users_email_key");

		insertDirectly("Mixed@Example.com");
		insertDirectly("mixed@example.com");
		assertThat(userCount()).isEqualTo(2);

		// logServerErrorDetail=false: the driver text names the constraint but not the key value.
		assertThatThrownBy(() -> insertDirectly("mixed@example.com")).isInstanceOf(DuplicateKeyException.class)
				.hasMessageContaining("app_users_email_key")
				.satisfies(ex -> assertThat(ex.getMessage()).doesNotContainIgnoringCase("mixed@example.com"));
	}

	private MvcTestResult register(String json) {
		return CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"))
				.contentType(MediaType.APPLICATION_JSON).content(json).exchange();
	}

	private void insertDirectly(String email) {
		jdbc.update("INSERT INTO app_users (email, password_hash, display_name) VALUES (?, 'not-a-real-hash', 'Direct')",
				email);
	}

	private int userCount() {
		return jdbc.queryForObject("SELECT count(*) FROM app_users", Integer.class);
	}

	private static String body(String email, String password, String displayName) {
		return "{\"email\":\"%s\",\"password\":\"%s\",\"displayName\":\"%s\"}".formatted(email, password, displayName);
	}
}
