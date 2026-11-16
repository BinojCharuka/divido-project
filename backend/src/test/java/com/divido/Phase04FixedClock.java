package com.divido;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

/**
 * Fixed "now" for the Phase 04 integration tests: 2026-11-16T06:00:00Z, which is
 * 11:30 on 16 November 2026 in Asia/Colombo. Shared so both test classes reuse one
 * Spring context.
 */
@TestConfiguration(proxyBeanMethods = false)
public class Phase04FixedClock {

    public static final Instant NOW = Instant.parse("2026-11-16T06:00:00Z");

    @Bean
    @Primary
    Clock phase04Clock() {
        return Clock.fixed(NOW, ZoneOffset.UTC);
    }
}
