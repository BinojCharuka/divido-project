package com.divido.controller;

import com.divido.CapturingPasswordResetMailer;
import com.divido.MutableTestClock;
import com.divido.TestcontainersConfiguration;
import com.divido.exception.PasswordResetInvalidException;
import com.divido.security.SlidingWindowRateLimiter;
import com.divido.service.PasswordResetService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static com.divido.ApiSession.PASSWORD;
import static com.divido.ApiSession.body;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.post;
import static com.divido.ApiSession.registerAndLogin;
import static org.assertj.core.api.Assertions.assertThat;

/** DIV-029: AUTH-007 and AUTH-008, forgot password (DEC-045). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, MutableTestClock.class, CapturingPasswordResetMailer.class})
class PasswordResetIntegrationTest {

    private static final String NEW_PASSWORD = "reset-new-password";
    private static final String INVALID = "This reset link is invalid or has expired. Request a new one.";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private CapturingPasswordResetMailer.Outbox outbox;

    @Autowired
    private MutableTestClock.Adjustable clock;

    @Autowired
    private SlidingWindowRateLimiter rateLimiter;

    @Autowired
    private PasswordResetService passwordResetService;

    /** The outbox and limiter beans are shared with other test classes in the same context. */
    @BeforeEach
    void startClean() {
        outbox.clear();
        rateLimiter.reset();
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM app_users");
        outbox.clear();
        clock.reset();
        rateLimiter.reset();
    }

    private MvcTestResult request(String email) {
        return post(mvc, "/api/v1/auth/password-reset/request", "{\"email\":\"" + email + "\"}", null);
    }

    private MvcTestResult confirm(String token, String newPassword) {
        return post(mvc, "/api/v1/auth/password-reset/confirm",
                "{\"token\":\"" + token + "\",\"newPassword\":\"" + newPassword + "\"}", null);
    }

    private MvcTestResult login(String email, String password) {
        return post(mvc, "/api/v1/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}", null);
    }

    private static void assertInvalid(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat((String) JsonPath.read(body(result), "$.code")).isEqualTo("PASSWORD_RESET_INVALID");
        assertThat((String) JsonPath.read(body(result), "$.message")).isEqualTo(INVALID);
    }

    // --- AUTH-007: request ------------------------------------------------------

    @Test
    void knownEmailGetsASingleUseLinkAndOnlyTheHashIsStored() {
        registerAndLogin(mvc, "reset@example.com");

        MvcTestResult result = request("  Reset@Example.COM ");

        assertThat(result).hasStatus(HttpStatus.ACCEPTED);
        assertThat(body(result)).isEmpty();
        assertThat(outbox.sent()).hasSize(1);
        CapturingPasswordResetMailer.Sent mail = outbox.last();
        assertThat(mail.to()).isEqualTo("reset@example.com");
        assertThat(mail.displayName()).isEqualTo("User");
        assertThat(mail.validFor()).isEqualTo(Duration.ofMinutes(30));
        assertThat(mail.link()).startsWith("http://localhost:3000/reset-password#token=");
        assertThat(mail.token()).matches("[A-Za-z0-9_-]{43}");

        var row = jdbc.queryForMap("SELECT token_hash, expires_at, used_at FROM password_reset_tokens");
        assertThat((String) row.get("token_hash")).matches("[0-9a-f]{64}").doesNotContain(mail.token());
        assertThat(((Timestamp) row.get("expires_at")).toInstant())
                .isEqualTo(MutableTestClock.START.plus(Duration.ofMinutes(30)));
        assertThat(row.get("used_at")).isNull();
    }

    @Test
    void unknownEmailGetsTheSameReplyAndNothingIsSent() {
        registerAndLogin(mvc, "someone@example.com");

        MvcTestResult unknown = request("nobody@example.com");
        MvcTestResult known = request("someone@example.com");

        assertThat(unknown).hasStatus(HttpStatus.ACCEPTED);
        assertThat(body(unknown)).isEqualTo(body(known));
        assertThat(outbox.sent()).extracting(CapturingPasswordResetMailer.Sent::to).containsExactly("someone@example.com");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM password_reset_tokens", Integer.class)).isEqualTo(1);
    }

    @Test
    void requestValidatesTheEmailAndNeedsCsrf() {
        assertThat(request("not-an-email")).hasStatus(HttpStatus.BAD_REQUEST);
        var withoutCsrf = mvc.post().uri("/api/v1/auth/password-reset/request")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"a@example.com\"}");
        assertThat(withoutCsrf).hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void anEmailGetsAtMostThreeLinksInTenMinutes() {
        registerAndLogin(mvc, "flood@example.com");

        for (int i = 0; i < 5; i++) {
            assertThat(request("flood@example.com")).hasStatus(HttpStatus.ACCEPTED);
        }
        assertThat(outbox.sent()).hasSize(3);

        clock.advance(Duration.ofMinutes(10).plusSeconds(1));
        assertThat(request("flood@example.com")).hasStatus(HttpStatus.ACCEPTED);
        assertThat(outbox.sent()).hasSize(4);
    }

    // --- AUTH-008: confirm ------------------------------------------------------

    @Test
    void resetChangesThePasswordWorksOnceAndEndsEverySession() {
        MockHttpSession signedIn = registerAndLogin(mvc, "confirm@example.com");
        request("confirm@example.com");
        String token = outbox.last().token();

        assertThat(confirm(token, NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);

        assertThat(login("confirm@example.com", PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(login("confirm@example.com", NEW_PASSWORD)).hasStatus(HttpStatus.OK);
        assertThat(get(mvc, "/api/v1/profile", signedIn)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM password_reset_tokens", Integer.class)).isZero();

        assertInvalid(confirm(token, "another-password-1"));
        assertThat(login("confirm@example.com", NEW_PASSWORD)).hasStatus(HttpStatus.OK);
    }

    @Test
    void anExpiredLinkIsRefusedAndChangesNothing() {
        registerAndLogin(mvc, "expired@example.com");
        request("expired@example.com");
        String token = outbox.last().token();

        clock.advance(Duration.ofMinutes(30));
        assertInvalid(confirm(token, NEW_PASSWORD));
        assertThat(login("expired@example.com", PASSWORD)).hasStatus(HttpStatus.OK);
    }

    @Test
    void aLinkWorksUntilJustBeforeItsExpiry() {
        registerAndLogin(mvc, "almost@example.com");
        request("almost@example.com");

        clock.advance(Duration.ofMinutes(30).minusSeconds(1));
        assertThat(confirm(outbox.last().token(), NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void aNewRequestVoidsTheEarlierLink() {
        registerAndLogin(mvc, "twice@example.com");
        request("twice@example.com");
        String first = outbox.last().token();
        request("twice@example.com");
        String second = outbox.last().token();

        assertInvalid(confirm(first, NEW_PASSWORD));
        assertThat(confirm(second, NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void unknownAndMalformedTokensGetTheSameNeutralError() {
        registerAndLogin(mvc, "guess@example.com");
        request("guess@example.com");

        assertInvalid(confirm("A".repeat(43), NEW_PASSWORD));
        assertInvalid(confirm("short", NEW_PASSWORD));
        assertInvalid(confirm(outbox.last().token() + "x", NEW_PASSWORD));
        assertThat(login("guess@example.com", PASSWORD)).hasStatus(HttpStatus.OK);
    }

    @Test
    void anInvalidNewPasswordDoesNotUseUpTheLink() {
        registerAndLogin(mvc, "weak@example.com");
        request("weak@example.com");
        String token = outbox.last().token();

        MvcTestResult weak = confirm(token, "short");
        assertThat(weak).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat((String) JsonPath.read(body(weak), "$.fieldErrors.newPassword"))
                .isEqualTo("Password must be 8 to 72 characters.");
        assertThat(confirm(token, "€".repeat(25))).hasStatus(HttpStatus.BAD_REQUEST);

        assertThat(confirm(token, NEW_PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void twoSimultaneousConfirmsWithOneTokenLetExactlyOneSucceed() throws Exception {
        registerAndLogin(mvc, "race@example.com");
        request("race@example.com");
        String token = outbox.last().token();

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        for (String password : List.of("race-password-one", "race-password-two")) {
            results.add(pool.submit(() -> {
                start.await();
                try {
                    passwordResetService.confirm(token, password);
                    return true;
                } catch (PasswordResetInvalidException ex) {
                    return false;
                }
            }));
        }
        start.countDown();
        int succeeded = 0;
        for (Future<Boolean> result : results) {
            if (result.get(30, TimeUnit.SECONDS)) {
                succeeded++;
            }
        }
        pool.shutdown();

        assertThat(succeeded).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT credentials_version FROM app_users", Integer.class)).isEqualTo(1);
    }
}
