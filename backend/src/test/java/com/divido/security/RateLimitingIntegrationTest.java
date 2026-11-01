package com.divido.security;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
        "divido.rate-limit.enabled=true",
        "divido.rate-limit.login.limit=5",
        "divido.rate-limit.login.window=1m",
        "divido.rate-limit.register.limit=3",
        "divido.rate-limit.register.window=1m",
        "divido.rate-limit.trusted-proxies=10.0.0.1, 10.0.0.2"
})
class RateLimitingIntegrationTest {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private SlidingWindowRateLimiter rateLimiter;

    @Autowired
    private RateLimitMaintenanceScheduler maintenanceScheduler;

    @BeforeEach
    void resetLimiter() {
        rateLimiter.reset();
    }

    @Test
    void requestsBelowLimitSucceedNormally() {
        for (int i = 0; i < 5; i++) {
            var result = postLogin("192.168.1.100", "{\"email\":\"user@example.com\",\"password\":\"wrong\"}");
            // 401 because credentials are fake, but NOT 429
            assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        }
    }

    @Test
    void loginLimitExceededReturns429WithConsistentEnvelope() {
        String clientIp = "192.168.1.101";
        for (int i = 0; i < 5; i++) {
            var result = postLogin(clientIp, "{\"email\":\"user@example.com\",\"password\":\"wrong\"}");
            assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        }

        // 6th attempt must be rejected with 429
        var rejected = postLogin(clientIp, "{\"email\":\"user@example.com\",\"password\":\"wrong\"}");
        assertThat(rejected).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(rejected.getResponse().getHeader("Retry-After")).isNotNull();
        assertThat(rejected).bodyJson().extractingPath("$.status").isEqualTo(429);
        assertThat(rejected).bodyJson().extractingPath("$.code").isEqualTo("RATE_LIMIT_EXCEEDED");
        assertThat(rejected).bodyJson().extractingPath("$.message").isEqualTo("Too many requests. Please try again later.");
        assertThat(rejected).bodyJson().extractingPath("$").asMap().containsOnlyKeys("status", "code", "message");
    }

    @Test
    void registrationLimitExceededReturns429() {
        String clientIp = "192.168.1.102";
        for (int i = 0; i < 3; i++) {
            var result = postRegister(clientIp, "{\"email\":\"reg" + i + "@example.com\",\"password\":\"validPassword123\",\"displayName\":\"User\"}");
            assertThat(result).hasStatus(HttpStatus.CREATED);
        }

        // 4th registration attempt must be rejected with 429
        var rejected = postRegister(clientIp, "{\"email\":\"reg4@example.com\",\"password\":\"validPassword123\",\"displayName\":\"User\"}");
        assertThat(rejected).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(rejected.getResponse().getHeader("Retry-After")).isNotNull();
        assertThat(rejected).bodyJson().extractingPath("$.code").isEqualTo("RATE_LIMIT_EXCEEDED");
    }

    @Test
    void loginAndRegisterLimitsAreIndependentlyEnforced() {
        String clientIp = "192.168.1.103";

        // Exhaust registration limit (3)
        for (int i = 0; i < 3; i++) {
            var result = postRegister(clientIp, "{\"email\":\"user" + i + "@example.com\",\"password\":\"validPassword123\",\"displayName\":\"User\"}");
            assertThat(result).hasStatus(HttpStatus.CREATED);
        }
        assertThat(postRegister(clientIp, "{\"email\":\"userX@example.com\",\"password\":\"validPassword123\",\"displayName\":\"User\"}"))
                .hasStatus(HttpStatus.TOO_MANY_REQUESTS);

        // Login endpoint for the same IP must still be available (limit = 5)
        var loginResult = postLogin(clientIp, "{\"email\":\"user0@example.com\",\"password\":\"wrong\"}");
        assertThat(loginResult).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void differentClientIpsAreTrackedIndependently() {
        String ip1 = "192.168.1.104";
        String ip2 = "192.168.1.105";

        for (int i = 0; i < 5; i++) {
            postLogin(ip1, "{\"email\":\"user@example.com\",\"password\":\"wrong\"}");
        }
        assertThat(postLogin(ip1, "{\"email\":\"user@example.com\",\"password\":\"wrong\"}"))
                .hasStatus(HttpStatus.TOO_MANY_REQUESTS);

        // ip2 should still succeed
        assertThat(postLogin(ip2, "{\"email\":\"user@example.com\",\"password\":\"wrong\"}"))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void untrustedProxyCannotSpoofXForwardedFor() {
        String untrustedIp = "192.168.1.200";
        // Client attempts to spoof X-Forwarded-For: 8.8.8.8
        for (int i = 0; i < 5; i++) {
            var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            request.header("X-Forwarded-For", "8.8.8." + i);
            request.with(r -> {
                r.setRemoteAddr(untrustedIp);
                return r;
            });
            request.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            request.exchange();
        }

        // Even though X-Forwarded-For varied, the untrusted remoteAddr was rate limited
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        request.header("X-Forwarded-For", "8.8.8.99");
        request.with(r -> {
            r.setRemoteAddr(untrustedIp);
            return r;
        });
        request.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        var rejected = request.exchange();
        assertThat(rejected).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void trustedProxyUsesRightToLeftUntrustedHop() {
        String trustedProxy1 = "10.0.0.1";
        String clientIp1 = "203.0.113.10";

        // Normal trusted proxy chain: clientIp1, trustedProxy1
        for (int i = 0; i < 5; i++) {
            var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            req.header("X-Forwarded-For", clientIp1);
            req.with(r -> {
                r.setRemoteAddr(trustedProxy1);
                return r;
            });
            req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            req.exchange();
        }

        // 6th attempt for clientIp1 is rate-limited
        var req1 = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        req1.header("X-Forwarded-For", clientIp1);
        req1.with(r -> {
            r.setRemoteAddr(trustedProxy1);
            return r;
        });
        req1.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        assertThat(req1.exchange()).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void multipleTrustedProxiesInChainHandledCorrectly() {
        String trustedProxy1 = "10.0.0.1"; // Immediate remoteAddr
        String trustedProxy2 = "10.0.0.2"; // Intermediate proxy
        String genuineClient = "198.51.100.50";

        // Chain: genuineClient, trustedProxy2 (connecting to trustedProxy1)
        for (int i = 0; i < 5; i++) {
            var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            req.header("X-Forwarded-For", genuineClient + ", " + trustedProxy2);
            req.with(r -> {
                r.setRemoteAddr(trustedProxy1);
                return r;
            });
            req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            req.exchange();
        }

        // genuineClient is now throttled
        var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        req.header("X-Forwarded-For", genuineClient + ", " + trustedProxy2);
        req.with(r -> {
            r.setRemoteAddr(trustedProxy1);
            return r;
        });
        req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        assertThat(req.exchange()).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void spoofedLeftmostXffDoesNotBypassLimitWhenActualClientFollows() {
        String trustedProxy1 = "10.0.0.1";
        String genuineClient = "198.51.100.77";

        // Attacker sends arbitrary spoofed leftmost IPs: "1.1.1.1", "2.2.2.2", ...
        // Proxy appends genuineClient: "spoofed, genuineClient"
        for (int i = 0; i < 5; i++) {
            var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            req.header("X-Forwarded-For", "1.1.1." + i + ", " + genuineClient);
            req.with(r -> {
                r.setRemoteAddr(trustedProxy1);
                return r;
            });
            req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            req.exchange();
        }

        // Next request with another spoofed leftmost IP ("9.9.9.9, genuineClient") is still blocked
        // because the right-to-left resolver extracts genuineClient!
        var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        req.header("X-Forwarded-For", "9.9.9.9, " + genuineClient);
        req.with(r -> {
            r.setRemoteAddr(trustedProxy1);
            return r;
        });
        req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        assertThat(req.exchange()).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void malformedOrInvalidXffSafelyFallsBackToRemoteAddr() {
        String trustedProxy1 = "10.0.0.1";

        // Attacker sends malformed non-IP string in XFF
        for (int i = 0; i < 5; i++) {
            var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            req.header("X-Forwarded-For", "not-a-valid-ip-address");
            req.with(r -> {
                r.setRemoteAddr(trustedProxy1);
                return r;
            });
            req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            req.exchange();
        }

        // Falls back to remoteAddr (10.0.0.1) and is rate limited safely without crashing
        var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        req.header("X-Forwarded-For", "not-a-valid-ip-address");
        req.with(r -> {
            r.setRemoteAddr(trustedProxy1);
            return r;
        });
        req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        assertThat(req.exchange()).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void hostnameInXffSafelyFallsBackToRemoteAddrWithoutDnsLookup() {
        String trustedProxy1 = "10.0.0.1";

        // Attacker sends DNS hostnames in XFF (e.g. localhost, internal hostname)
        for (int i = 0; i < 5; i++) {
            var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
            req.header("X-Forwarded-For", "localhost");
            req.with(r -> {
                r.setRemoteAddr(trustedProxy1);
                return r;
            });
            req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
            req.exchange();
        }

        // Hostname is rejected without DNS lookup, falls back to remoteAddr (10.0.0.1) and is rate limited
        var req = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        req.header("X-Forwarded-For", "attacker-host.invalid");
        req.with(r -> {
            r.setRemoteAddr(trustedProxy1);
            return r;
        });
        req.contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        assertThat(req.exchange()).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void idleBucketsAreEvictedDuringMaintenance() {
        // Create 20 distinct client IP entries
        for (int i = 0; i < 20; i++) {
            postLogin("192.168.2." + i, "{\"email\":\"u@example.com\",\"password\":\"wrong\"}");
        }
        assertThat(rateLimiter.getBucketCount()).isEqualTo(20);

        // Run maintenance with zero threshold (all buckets are older than threshold)
        maintenanceScheduler.cleanupExpiredBuckets(Duration.ZERO);

        // All idle entries are cleared from memory
        assertThat(rateLimiter.getBucketCount()).isEqualTo(0);
    }

    @Test
    void concurrentRequestsSafelyEnforceLimit() throws InterruptedException {
        String clientIp = "192.168.1.106";
        int totalRequests = 15;
        int limit = 5;

        ExecutorService executor = Executors.newFixedThreadPool(totalRequests);
        CountDownLatch readyLatch = new CountDownLatch(totalRequests);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successOrAuthFailed = new AtomicInteger(0);
        AtomicInteger rateLimited = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < totalRequests; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    var res = postLogin(clientIp, "{\"email\":\"con@example.com\",\"password\":\"wrong\"}");
                    if (res.getResponse().getStatus() == 401) {
                        successOrAuthFailed.incrementAndGet();
                    } else if (res.getResponse().getStatus() == 429) {
                        rateLimited.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
        }

        readyLatch.await();
        startLatch.countDown();

        for (Future<?> f : futures) {
            try {
                f.get();
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
        }
        executor.shutdown();

        assertThat(successOrAuthFailed.get()).isEqualTo(limit);
        assertThat(rateLimited.get()).isEqualTo(totalRequests - limit);
    }

    private org.springframework.test.web.servlet.assertj.MvcTestResult postLogin(String remoteAddr, String json) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"));
        request.with(r -> {
            r.setRemoteAddr(remoteAddr);
            return r;
        });
        request.contentType(MediaType.APPLICATION_JSON).content(json);
        return request.exchange();
    }

    private org.springframework.test.web.servlet.assertj.MvcTestResult postRegister(String remoteAddr, String json) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"));
        request.with(r -> {
            r.setRemoteAddr(remoteAddr);
            return r;
        });
        request.contentType(MediaType.APPLICATION_JSON).content(json);
        return request.exchange();
    }
}
