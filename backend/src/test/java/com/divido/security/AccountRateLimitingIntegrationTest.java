package com.divido.security;

import com.divido.CapturingPasswordResetMailer;
import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;

import static com.divido.ApiSession.registerAndLogin;
import static com.divido.ApiSession.withSession;
import static org.assertj.core.api.Assertions.assertThat;

/** Per-IP limits on the password endpoints (DEC-043, DEC-045, DEC-046). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, CapturingPasswordResetMailer.class})
@TestPropertySource(properties = {
        "divido.rate-limit.enabled=true",
        "divido.rate-limit.login.limit=50",
        "divido.rate-limit.register.limit=50",
        "divido.rate-limit.password-reset.limit=2",
        "divido.rate-limit.password-reset.window=1m",
        "divido.rate-limit.password-check.limit=2",
        "divido.rate-limit.password-check.window=1m"
})
class AccountRateLimitingIntegrationTest {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private SlidingWindowRateLimiter rateLimiter;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void resetLimiter() {
        rateLimiter.reset();
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM app_users");
    }

    private MvcTestResult send(MockMvcRequestBuilder request, String ip, String json, MockHttpSession session) {
        var withCsrf = CsrfSupport.fetch(mvc).apply(request);
        withSession(withCsrf, session);
        withCsrf.with(r -> {
            r.setRemoteAddr(ip);
            return r;
        });
        return withCsrf.contentType(MediaType.APPLICATION_JSON).content(json).exchange();
    }

    @Test
    void resetRequestsAreLimitedPerIp() {
        String json = "{\"email\":\"nobody@example.com\"}";
        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.1", json, null))
                .hasStatus(HttpStatus.ACCEPTED);
        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.1", json, null))
                .hasStatus(HttpStatus.ACCEPTED);

        MvcTestResult limited = send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.1", json, null);
        assertThat(limited).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(limited.getResponse().getHeader("Retry-After")).isNotNull();
        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.2", json, null))
                .hasStatus(HttpStatus.ACCEPTED);
    }

    @Test
    void resetConfirmsAreLimitedSeparatelyFromRequests() {
        String request = "{\"email\":\"nobody@example.com\"}";
        String confirm = "{\"token\":\"" + "A".repeat(43) + "\",\"newPassword\":\"a-long-password\"}";
        send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.3", request, null);
        send(mvc.post().uri("/api/v1/auth/password-reset/request"), "192.168.5.3", request, null);

        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/confirm"), "192.168.5.3", confirm, null))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/confirm"), "192.168.5.3", confirm, null))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(send(mvc.post().uri("/api/v1/auth/password-reset/confirm"), "192.168.5.3", confirm, null))
                .hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void passwordChangeAndDeletionShareOneLimit() {
        MockHttpSession session = registerAndLogin(mvc, "limited@example.com");
        String change = "{\"currentPassword\":\"wrong-password-1\",\"newPassword\":\"a-long-password\"}";
        String delete = "{\"password\":\"wrong-password-1\",\"confirmation\":\"DELETE\"}";

        assertThat(send(mvc.post().uri("/api/v1/profile/password"), "192.168.5.4", change, session))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(send(mvc.delete().uri("/api/v1/profile"), "192.168.5.4", delete, session))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(send(mvc.post().uri("/api/v1/profile/password"), "192.168.5.4", change, session))
                .hasStatus(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(send(mvc.delete().uri("/api/v1/profile"), "192.168.5.4", delete, session))
                .hasStatus(HttpStatus.TOO_MANY_REQUESTS);

        // Reading or renaming is not limited.
        assertThat(send(mvc.patch().uri("/api/v1/profile"), "192.168.5.4", "{\"displayName\":\"Still here\"}", session))
                .hasStatus(HttpStatus.OK);
    }
}
