package com.divido;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A clock tests can move forward, e.g. past a reset link's expiry. */
@TestConfiguration(proxyBeanMethods = false)
public class MutableTestClock {

    public static final Instant START = Instant.parse("2026-11-18T06:00:00Z");

    public static final class Adjustable extends Clock {

        private volatile Instant now = START;

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }

        public void advance(Duration duration) {
            now = now.plus(duration);
        }

        public void reset() {
            now = START;
        }
    }

    @Bean
    @Primary
    Adjustable mutableClock() {
        return new Adjustable();
    }
}
