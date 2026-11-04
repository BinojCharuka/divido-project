package com.divido.controller;

import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static com.divido.ApiSession.get;
import static com.divido.ApiSession.registerAndLogin;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Without {@code month}, the dashboard uses the current month in the user's timezone
 * (Asia/Colombo by default). The clock is fixed at 2026-10-31T18:30:00Z, which is
 * still October in UTC but already 00:00 on 1 November in Colombo (UTC+05:30).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DashboardDefaultMonthIntegrationTest.FixedClock.class})
class DashboardDefaultMonthIntegrationTest {

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-10-31T18:30:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM app_users");
    }

    @Test
    void omittedMonthUsesTheColomboCalendarMonth() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = get(mvc, "/api/v1/dashboard", session);
        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.month").isEqualTo("2026-11");
        assertThat(result).bodyJson().extractingPath("$.periodStart").isEqualTo("2026-11-01");
        assertThat(result).bodyJson().extractingPath("$.periodEnd").isEqualTo("2026-11-30");
    }

    @Test
    void storedUserTimezoneIsRespected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        jdbc.update("UPDATE app_users SET timezone = 'UTC' WHERE email = 'alice@example.com'");
        var result = get(mvc, "/api/v1/dashboard", session);
        assertThat(result).bodyJson().extractingPath("$.month").isEqualTo("2026-10");
    }
}
