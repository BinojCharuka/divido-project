package com.divido.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

/**
 * Periodically evicts expired rate-limiting buckets from memory to prevent unbounded memory growth.
 * Runs in the background every 5 minutes in production and cleans up buckets idle for longer than 10 minutes.
 */
@Component
public class RateLimitMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(RateLimitMaintenanceScheduler.class);
    private static final Duration IDLE_THRESHOLD = Duration.ofMinutes(10);

    private final SlidingWindowRateLimiter rateLimiter;
    private final Clock clock;

    public RateLimitMaintenanceScheduler(SlidingWindowRateLimiter rateLimiter, Clock clock) {
        this.rateLimiter = rateLimiter;
        this.clock = clock;
    }

    /**
     * Periodic cleanup task running every 5 minutes.
     */
    @Scheduled(fixedRateString = "${divido.rate-limit.maintenance.fixed-rate:300000}")
    public void cleanupExpiredBuckets() {
        int countBefore = rateLimiter.getBucketCount();
        if (countBefore > 0) {
            rateLimiter.evictExpired(IDLE_THRESHOLD, clock.millis());
            int countAfter = rateLimiter.getBucketCount();
            if (countBefore != countAfter) {
                log.debug("Rate limit cleanup evicted {} idle buckets. Remaining: {}", countBefore - countAfter, countAfter);
            }
        }
    }

    /**
     * Explicit trigger method for tests or administrative hooks.
     */
    public void cleanupExpiredBuckets(Duration maxIdle) {
        rateLimiter.evictExpired(maxIdle, clock.millis());
    }
}
