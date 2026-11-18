package com.divido.controller;

import com.divido.CapturingPasswordResetMailer;
import com.divido.MutableTestClock;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.sql.Timestamp;

import static com.divido.ApiSession.PASSWORD;
import static com.divido.ApiSession.body;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.post;
import static com.divido.ApiSession.registerAndLogin;
import static com.divido.ApiSession.withSession;
import static com.divido.ApiSession.write;
import static org.assertj.core.api.Assertions.assertThat;

/** DIV-022 and DIV-023: PROFILE-001..004 (DEC-043, DEC-044). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, MutableTestClock.class, CapturingPasswordResetMailer.class})
class ProfileIntegrationTest {

    private static final String NEW_PASSWORD = "a-new-long-password";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM app_users");
    }

    private MvcTestResult patch(String json, MockHttpSession session) {
        return write(mvc, mvc.patch().uri("/api/v1/profile"), json, session);
    }

    private MvcTestResult login(String email, String password) {
        return post(mvc, "/api/v1/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}", null);
    }

    private MockHttpSession secondSession(String email) {
        MvcTestResult result = login(email, PASSWORD);
        assertThat(result).hasStatus(HttpStatus.OK);
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private MvcTestResult changePassword(String current, String next, MockHttpSession session) {
        return post(mvc, "/api/v1/profile/password",
                "{\"currentPassword\":\"" + current + "\",\"newPassword\":\"" + next + "\"}", session);
    }

    // --- PROFILE-001 ------------------------------------------------------------

    @Test
    void profileRequiresSignIn() {
        assertThat(mvc.get().uri("/api/v1/profile")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void profileShowsTheSignedInUsersOwnFieldsAndNothingSecret() {
        MockHttpSession session = registerAndLogin(mvc, "profile-read@example.com");

        MvcTestResult result = get(mvc, "/api/v1/profile", session);

        assertThat(result).hasStatus(HttpStatus.OK);
        String json = body(result);
        assertThat((String) JsonPath.read(json, "$.email")).isEqualTo("profile-read@example.com");
        assertThat((String) JsonPath.read(json, "$.displayName")).isEqualTo("User");
        assertThat((String) JsonPath.read(json, "$.currency")).isEqualTo("LKR");
        assertThat((String) JsonPath.read(json, "$.timeZone")).isEqualTo("Asia/Colombo");
        assertThat((String) JsonPath.read(json, "$.locale")).isEqualTo("en");
        assertThat((Boolean) JsonPath.read(json, "$.onboardingComplete")).isFalse();
        assertThat(json).doesNotContain("password", "credentials", "$2");
    }

    // --- PROFILE-002 ------------------------------------------------------------

    @Test
    void displayNameIsTrimmedAndSavedAndOtherFieldsAreIgnored() {
        MockHttpSession session = registerAndLogin(mvc, "profile-edit@example.com");

        MvcTestResult result = patch("""
                {"displayName": "  Nimal Perera  ", "email": "other@example.com", "currency": "USD",
                 "timeZone": "UTC", "id": "00000000-0000-0000-0000-000000000000", "onboardingComplete": true}
                """, session);

        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat((String) JsonPath.read(body(result), "$.displayName")).isEqualTo("Nimal Perera");
        assertThat(jdbc.queryForMap(
                "SELECT email, display_name, currency, timezone, onboarding_completed_at FROM app_users"))
                .containsEntry("email", "profile-edit@example.com")
                .containsEntry("display_name", "Nimal Perera")
                .containsEntry("currency", "LKR")
                .containsEntry("timezone", "Asia/Colombo")
                .containsEntry("onboarding_completed_at", null);
    }

    @Test
    void displayNameFollowsTheRegistrationRule() {
        MockHttpSession session = registerAndLogin(mvc, "profile-invalid@example.com");

        for (String bad : new String[] {"{\"displayName\": \"   \"}", "{}",
                "{\"displayName\": \"" + "x".repeat(101) + "\"}", "{\"displayName\": \"a\\u0000b\"}"}) {
            MvcTestResult result = patch(bad, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(body(result)).contains("\"VALIDATION_ERROR\"", "\"displayName\"");
        }
        assertThat(patch("{\"displayName\": \"" + "x".repeat(100) + "\"}", session)).hasStatus(HttpStatus.OK);
    }

    @Test
    void editingNeedsCsrfAndSignIn() {
        MockHttpSession session = registerAndLogin(mvc, "profile-csrf@example.com");

        var withoutCsrf = withSession(mvc.patch().uri("/api/v1/profile"), session)
                .contentType(MediaType.APPLICATION_JSON).content("{\"displayName\":\"X\"}");
        assertThat(withoutCsrf).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(patch("{\"displayName\":\"X\"}", null)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(jdbc.queryForObject("SELECT display_name FROM app_users", String.class)).isEqualTo("User");
    }

    @Test
    void oneUsersEditNeverChangesAnotherUser() {
        MockHttpSession alice = registerAndLogin(mvc, "alice-profile@example.com");
        registerAndLogin(mvc, "bob-profile@example.com");

        assertThat(patch("{\"displayName\":\"Alice\"}", alice)).hasStatus(HttpStatus.OK);

        assertThat(jdbc.queryForObject("SELECT display_name FROM app_users WHERE email = 'bob-profile@example.com'",
                String.class)).isEqualTo("User");
    }

    // --- PROFILE-003: onboarding ------------------------------------------------

    @Test
    void onboardingCompletionIsRecordedOnceAndShownBySignInAndMe() {
        MockHttpSession session = registerAndLogin(mvc, "onboarding@example.com");
        assertThat((Boolean) JsonPath.read(body(get(mvc, "/api/v1/auth/me", session)), "$.user.onboardingComplete"))
                .isFalse();

        MvcTestResult first = post(mvc, "/api/v1/profile/onboarding-complete", null, session);
        assertThat(first).hasStatus(HttpStatus.OK);
        assertThat((Boolean) JsonPath.read(body(first), "$.onboardingComplete")).isTrue();
        Timestamp completedAt = jdbc.queryForObject("SELECT onboarding_completed_at FROM app_users", Timestamp.class);
        assertThat(completedAt.toInstant()).isEqualTo(MutableTestClock.START);

        assertThat(post(mvc, "/api/v1/profile/onboarding-complete", null, session)).hasStatus(HttpStatus.OK);
        assertThat(jdbc.queryForObject("SELECT onboarding_completed_at FROM app_users", Timestamp.class))
                .isEqualTo(completedAt);

        assertThat((Boolean) JsonPath.read(body(get(mvc, "/api/v1/auth/me", session)), "$.user.onboardingComplete"))
                .isTrue();
        assertThat((Boolean) JsonPath.read(body(login("onboarding@example.com", PASSWORD)),
                "$.user.onboardingComplete")).isTrue();
    }

    @Test
    void registrationReportsOnboardingNotDone() {
        MvcTestResult result = post(mvc, "/api/v1/auth/register",
                "{\"email\":\"fresh@example.com\",\"password\":\"" + PASSWORD + "\",\"displayName\":\"Fresh\"}", null);
        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat((Boolean) JsonPath.read(body(result), "$.user.onboardingComplete")).isFalse();
    }

    // --- PROFILE-004: password change --------------------------------------------

    @Test
    void passwordChangeKeepsThisSessionAndEndsTheOthers() {
        MockHttpSession current = registerAndLogin(mvc, "change@example.com");
        MockHttpSession other = secondSession("change@example.com");
        String sessionIdBefore = current.getId();

        MvcTestResult result = changePassword(PASSWORD, NEW_PASSWORD, current);

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        MockHttpSession renewed = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(renewed.getId()).isNotEqualTo(sessionIdBefore);
        assertThat(get(mvc, "/api/v1/profile", renewed)).hasStatus(HttpStatus.OK);
        assertThat(get(mvc, "/api/v1/profile", other)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(get(mvc, "/api/v1/profile", other)).hasStatus(HttpStatus.UNAUTHORIZED);

        assertThat(login("change@example.com", PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(login("change@example.com", NEW_PASSWORD)).hasStatus(HttpStatus.OK);
        assertThat(jdbc.queryForObject("SELECT credentials_version FROM app_users", Integer.class)).isEqualTo(1);
    }

    @Test
    void passwordChangeRejectsAWrongCurrentPasswordAndChangesNothing() {
        MockHttpSession session = registerAndLogin(mvc, "change-wrong@example.com");
        String hashBefore = jdbc.queryForObject("SELECT password_hash FROM app_users", String.class);

        MvcTestResult result = changePassword("not-the-password", NEW_PASSWORD, session);

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat((String) JsonPath.read(body(result), "$.fieldErrors.currentPassword"))
                .isEqualTo("The current password is incorrect.");
        assertThat(jdbc.queryForObject("SELECT password_hash FROM app_users", String.class)).isEqualTo(hashBefore);
        assertThat(get(mvc, "/api/v1/profile", session)).hasStatus(HttpStatus.OK);
    }

    @Test
    void passwordChangeValidatesTheNewPassword() {
        MockHttpSession session = registerAndLogin(mvc, "change-rules@example.com");

        assertThat((String) JsonPath.read(body(changePassword(PASSWORD, "short", session)), "$.fieldErrors.newPassword"))
                .isEqualTo("Password must be 8 to 72 characters.");
        assertThat((String) JsonPath.read(body(changePassword(PASSWORD, PASSWORD, session)), "$.fieldErrors.newPassword"))
                .isEqualTo("Choose a password different from your current one.");
        // 25 characters pass the length rule, but 75 UTF-8 bytes exceed BCrypt's 72-byte limit.
        assertThat((String) JsonPath.read(body(changePassword(PASSWORD, "€".repeat(25), session)),
                "$.fieldErrors.newPassword")).isEqualTo("Password is too long.");
        assertThat(jdbc.queryForObject("SELECT credentials_version FROM app_users", Integer.class)).isZero();
    }

    @Test
    void passwordChangeNeedsCsrfAndSignIn() {
        MockHttpSession session = registerAndLogin(mvc, "change-csrf@example.com");

        var withoutCsrf = withSession(mvc.post().uri("/api/v1/profile/password"), session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"" + NEW_PASSWORD + "\"}");
        assertThat(withoutCsrf).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(changePassword(PASSWORD, NEW_PASSWORD, null)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(login("change-csrf@example.com", PASSWORD)).hasStatus(HttpStatus.OK);
    }

    @Test
    void responsesNeverEchoPasswords() {
        MockHttpSession session = registerAndLogin(mvc, "change-echo@example.com");
        assertThat(body(changePassword("wrong-password-123", NEW_PASSWORD, session)))
                .doesNotContain("wrong-password-123", NEW_PASSWORD);
    }
}
