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

import java.util.List;
import java.util.UUID;

import static com.divido.ApiSession.PASSWORD;
import static com.divido.ApiSession.body;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.post;
import static com.divido.ApiSession.put;
import static com.divido.ApiSession.registerAndLogin;
import static com.divido.ApiSession.withSession;
import static com.divido.ApiSession.write;
import static org.assertj.core.api.Assertions.assertThat;

/** DIV-035: PROFILE-005, self-service account deletion (DEC-046). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, MutableTestClock.class, CapturingPasswordResetMailer.class})
class AccountDeletionIntegrationTest {

    /** Every table that holds a user's rows, with the column that leads back to the user. */
    private static final List<String> OWNED = List.of(
            "SELECT count(*) FROM transactions WHERE user_id = ?",
            "SELECT count(*) FROM categories WHERE user_id = ?",
            "SELECT count(*) FROM income_sources WHERE user_id = ?",
            "SELECT count(*) FROM monthly_budgets WHERE user_id = ?",
            "SELECT count(*) FROM reflections WHERE user_id = ?",
            "SELECT count(*) FROM reflection_answers a JOIN reflections r ON r.id = a.reflection_id WHERE r.user_id = ?",
            "SELECT count(*) FROM password_reset_tokens WHERE user_id = ?",
            "SELECT count(*) FROM app_users WHERE id = ?");

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM transactions");
        jdbc.update("DELETE FROM app_users");
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("SELECT id FROM app_users WHERE email = ?", UUID.class, email);
    }

    private MvcTestResult deleteAccount(String password, String confirmation, MockHttpSession session) {
        return write(mvc, mvc.delete().uri("/api/v1/profile"),
                "{\"password\":\"" + password + "\",\"confirmation\":\"" + confirmation + "\"}", session);
    }

    private static String id(MvcTestResult result) {
        return JsonPath.read(body(result), "$.id");
    }

    /** Creates one of everything through the API, including rows tied by RESTRICT keys. */
    private void createData(MockHttpSession session, String email) {
        MvcTestResult category = post(mvc, "/api/v1/categories", "{\"name\":\"Pets\",\"group\":\"WANTS\"}", session);
        assertThat(category).hasStatus(HttpStatus.CREATED);
        MvcTestResult source = post(mvc, "/api/v1/income-sources", "{\"name\":\"Salary\"}", session);
        assertThat(source).hasStatus(HttpStatus.CREATED);
        assertThat(post(mvc, "/api/v1/transactions", """
                {"type":"EXPENSE","amount":"1200.00","date":"2026-11-10","categoryId":"%s"}
                """.formatted(id(category)), session)).hasStatus(HttpStatus.CREATED);
        assertThat(post(mvc, "/api/v1/transactions", """
                {"type":"INCOME","amount":"90000.00","date":"2026-11-01","incomeSourceId":"%s"}
                """.formatted(id(source)), session)).hasStatus(HttpStatus.CREATED);
        assertThat(put(mvc, "/api/v1/budgets/2026-11", """
                {"plannedIncome":"90000.00","savingsTarget":"10000.00",
                 "allocations":{"NEEDS":"40000.00","WANTS":"20000.00","CULTURE":"10000.00","UNEXPECTED":"5000.00"}}
                """, session)).hasStatus(HttpStatus.OK);
        assertThat(put(mvc, "/api/v1/reflections/2026-11",
                "{\"answers\":[{\"questionId\":\"what-went-well\",\"answer\":\"Synthetic answer.\"}]}", session))
                .hasStatus(HttpStatus.OK);
        assertThat(post(mvc, "/api/v1/auth/password-reset/request", "{\"email\":\"" + email + "\"}", null))
                .hasStatus(HttpStatus.ACCEPTED);
    }

    private void assertOwnedRows(UUID userId, boolean expectAny) {
        for (String query : OWNED) {
            Integer count = jdbc.queryForObject(query, Integer.class, userId);
            if (expectAny) {
                assertThat(count).as(query).isPositive();
            } else {
                assertThat(count).as(query).isZero();
            }
        }
    }

    @Test
    void deletionRemovesEveryOwnedRowAndEndsEverySession() {
        MockHttpSession session = registerAndLogin(mvc, "leaving@example.com");
        MockHttpSession otherDevice = (MockHttpSession) post(mvc, "/api/v1/auth/login",
                "{\"email\":\"leaving@example.com\",\"password\":\"" + PASSWORD + "\"}", null)
                .getRequest().getSession(false);
        createData(session, "leaving@example.com");
        UUID userId = userId("leaving@example.com");
        assertOwnedRows(userId, true);

        MockHttpSession staying = registerAndLogin(mvc, "staying@example.com");
        createData(staying, "staying@example.com");
        UUID stayingId = userId("staying@example.com");

        MvcTestResult result = deleteAccount(PASSWORD, "DELETE", session);

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(result.getResponse().getHeaders("Set-Cookie")).anyMatch(c -> c.contains("Max-Age=0"));
        assertOwnedRows(userId, false);
        assertThat(get(mvc, "/api/v1/profile", session)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(get(mvc, "/api/v1/profile", otherDevice)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(post(mvc, "/api/v1/auth/login",
                "{\"email\":\"leaving@example.com\",\"password\":\"" + PASSWORD + "\"}", null))
                .hasStatus(HttpStatus.UNAUTHORIZED);

        assertOwnedRows(stayingId, true);
        assertThat(get(mvc, "/api/v1/profile", staying)).hasStatus(HttpStatus.OK);
        // The shared default categories are not anyone's to delete.
        assertThat(jdbc.queryForObject("SELECT count(*) FROM categories WHERE user_id IS NULL", Integer.class))
                .isEqualTo(3);
    }

    @Test
    void theEmailCanRegisterAgainAfterDeletion() {
        MockHttpSession session = registerAndLogin(mvc, "again@example.com");
        assertThat(deleteAccount(PASSWORD, "DELETE", session)).hasStatus(HttpStatus.NO_CONTENT);

        registerAndLogin(mvc, "again@example.com");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM app_users WHERE email = 'again@example.com'",
                Integer.class)).isEqualTo(1);
    }

    @Test
    void aWrongConfirmationWordDeletesNothing() {
        MockHttpSession session = registerAndLogin(mvc, "confirm-word@example.com");

        for (String word : new String[] {"delete", "DELETE ME", "YES"}) {
            MvcTestResult result = deleteAccount(PASSWORD, word, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat((String) JsonPath.read(body(result), "$.fieldErrors.confirmation"))
                    .isEqualTo("Type DELETE to confirm.");
        }
        assertThat(get(mvc, "/api/v1/profile", session)).hasStatus(HttpStatus.OK);
    }

    @Test
    void aWrongPasswordDeletesNothing() {
        MockHttpSession session = registerAndLogin(mvc, "confirm-password@example.com");

        MvcTestResult result = deleteAccount("not-my-password", "DELETE", session);

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat((String) JsonPath.read(body(result), "$.fieldErrors.password")).isEqualTo("The password is incorrect.");
        assertThat(body(result)).doesNotContain("not-my-password");
        assertThat(get(mvc, "/api/v1/profile", session)).hasStatus(HttpStatus.OK);
    }

    @Test
    void deletionNeedsSignInCsrfAndABody() {
        MockHttpSession session = registerAndLogin(mvc, "guarded@example.com");

        assertThat(deleteAccount(PASSWORD, "DELETE", null)).hasStatus(HttpStatus.UNAUTHORIZED);
        var withoutCsrf = withSession(mvc.delete().uri("/api/v1/profile"), session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"" + PASSWORD + "\",\"confirmation\":\"DELETE\"}");
        assertThat(withoutCsrf).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(write(mvc, mvc.delete().uri("/api/v1/profile"), null, session)).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM app_users", Integer.class)).isEqualTo(1);
    }
}
