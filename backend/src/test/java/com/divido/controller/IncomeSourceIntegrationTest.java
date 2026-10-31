package com.divido.controller;

import com.divido.CsrfSupport;
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

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class IncomeSourceIntegrationTest {

    private static final String PASSWORD = "correct-horse-battery";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUpUserData() {
        jdbc.update("DELETE FROM income_sources");
        jdbc.update("DELETE FROM app_users");
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        var result = mvc.get().uri("/api/v1/income-sources").exchange();
        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void userCanCreateAndListIncomeSources() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Initially empty
        var emptyList = getWithSession("/api/v1/income-sources", session);
        assertThat(emptyList).hasStatus(HttpStatus.OK);
        assertThat(emptyList).bodyJson().extractingPath("$.items").asList().isEmpty();

        // Create income source
        String payload = "{\"name\":\"Monthly Salary\"}";
        var created = postWithCsrf("/api/v1/income-sources", payload, session);
        assertThat(created).hasStatus(HttpStatus.CREATED);
        assertThat(created).bodyJson().extractingPath("$.name").isEqualTo("Monthly Salary");
        assertThat(created).bodyJson().extractingPath("$.active").isEqualTo(true);

        // List income sources
        var list = getWithSession("/api/v1/income-sources", session);
        assertThat(list).hasStatus(HttpStatus.OK);
        assertThat(list).bodyJson().extractingPath("$.items").asList().hasSize(1);
        assertThat(list).bodyJson().extractingPath("$.items[0].name").isEqualTo("Monthly Salary");
    }

    @Test
    void userCannotAccessOrModifyAnotherUsersIncomeSources() {
        MockHttpSession sessionAlice = registerAndLogin("alice@example.com");
        MockHttpSession sessionBob = registerAndLogin("bob@example.com");

        // Alice creates income source
        var created = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Alice Salary\"}", sessionAlice);
        assertThat(created).hasStatus(HttpStatus.CREATED);
        String aliceSourceId = JsonPath.read(body(created), "$.id");

        // Bob lists: should NOT see Alice's income source
        var bobList = getWithSession("/api/v1/income-sources", sessionBob);
        assertThat(bobList).hasStatus(HttpStatus.OK);
        assertThat(bobList).bodyJson().extractingPath("$.items").asList().isEmpty();

        // Bob tries to update Alice's income source -> 404 (does not disclose existence)
        var bobUpdate = patchWithCsrf("/api/v1/income-sources/" + aliceSourceId,
                "{\"name\":\"Hacked Salary\"}", sessionBob);
        assertThat(bobUpdate).hasStatus(HttpStatus.NOT_FOUND);

        // Bob tries to deactivate Alice's income source -> 404
        var bobDeactivate = postWithCsrf("/api/v1/income-sources/" + aliceSourceId + "/deactivate",
                null, sessionBob);
        assertThat(bobDeactivate).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void duplicateIncomeSourceNameForSameUserIsRejectedWithConflict() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var created = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Freelance\"}", session);
        assertThat(created).hasStatus(HttpStatus.CREATED);

        // Duplicate name (even with whitespace / case differences)
        var duplicate = postWithCsrf("/api/v1/income-sources", "{\"name\":\"  freelance  \"}", session);
        assertThat(duplicate).hasStatus(HttpStatus.CONFLICT);
        assertThat(duplicate).bodyJson().extractingPath("$.code").isEqualTo("CONFLICT");
    }

    @Test
    void userCanUpdateAndDeactivateIncomeSource() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var created = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Primary Job\"}", session);
        assertThat(created).hasStatus(HttpStatus.CREATED);
        String sourceId = JsonPath.read(body(created), "$.id");

        // Update name
        var updated = patchWithCsrf("/api/v1/income-sources/" + sourceId,
                "{\"name\":\"Senior Engineer Salary\"}", session);
        assertThat(updated).hasStatus(HttpStatus.OK);
        assertThat(updated).bodyJson().extractingPath("$.name").isEqualTo("Senior Engineer Salary");

        // Deactivate
        var deactivated = postWithCsrf("/api/v1/income-sources/" + sourceId + "/deactivate", null, session);
        assertThat(deactivated).hasStatus(HttpStatus.NO_CONTENT);

        // Listing active excludes it
        var listActive = getWithSession("/api/v1/income-sources", session);
        assertThat(listActive).hasStatus(HttpStatus.OK);
        assertThat(listActive).bodyJson().extractingPath("$.items").asList().isEmpty();

        // Listing with includeInactive includes it with active=false
        var listAll = getWithSession("/api/v1/income-sources?includeInactive=true", session);
        assertThat(listAll).hasStatus(HttpStatus.OK);
        List<String> names = JsonPath.read(body(listAll), "$.items[*].name");
        assertThat(names).contains("Senior Engineer Salary");
        Boolean active = JsonPath.read(body(listAll), "$.items[0].active");
        assertThat(active).isFalse();
    }

    @Test
    void validationErrorsReturnBadRequest() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Blank name
        var blankResult = postWithCsrf("/api/v1/income-sources", "{\"name\":\"   \"}", session);
        assertThat(blankResult).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(blankResult).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");
        assertThat(blankResult).bodyJson().extractingPath("$.fieldErrors.name").isNotNull();
    }

    @Test
    void stateChangingRequestsRequireCsrf() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var request = mvc.post().uri("/api/v1/income-sources")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\"}");
        var result = request.exchange();
        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
    }

    // Helper methods
    private MockHttpSession registerAndLogin(String email) {
        var reg = postWithCsrf("/api/v1/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"displayName\":\"User\"}", null);
        assertThat(reg).hasStatus(HttpStatus.CREATED);

        var loginResult = postWithCsrf("/api/v1/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}", null);
        assertThat(loginResult).hasStatus(HttpStatus.OK);
        return (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    private MvcTestResult postWithCsrf(String uri, String json, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri(uri));
        if (session != null) {
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

    private MvcTestResult patchWithCsrf(String uri, String json, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.patch().uri(uri));
        if (session != null) {
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

    private MvcTestResult getWithSession(String uri, MockHttpSession session) {
        var request = mvc.get().uri(uri);
        if (session != null) {
            request.session(session).with(r -> {
                r.setRequestedSessionId(session.getId());
                r.setRequestedSessionIdValid(true);
                return r;
            });
        }
        return request.exchange();
    }

    private static String body(MvcTestResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }
}
