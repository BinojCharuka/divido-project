package com.divido.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class SlidingWindowRateLimiterTest {

    private SlidingWindowRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new SlidingWindowRateLimiter();
    }

    @Test
    void requestsBelowLimitSucceed() {
        String key = "test:127.0.0.1";
        Duration window = Duration.ofMinutes(1);
        long now = 1_000_000L;

        for (int i = 0; i < 5; i++) {
            boolean acquired = limiter.tryAcquire(key, 5, window, now + (i * 100));
            assertThat(acquired).isTrue();
        }
    }

    @Test
    void requestExceedingLimitIsRejected() {
        String key = "test:127.0.0.1";
        Duration window = Duration.ofMinutes(1);
        long now = 1_000_000L;

        for (int i = 0; i < 5; i++) {
            assertThat(limiter.tryAcquire(key, 5, window, now)).isTrue();
        }

        // 6th request within window must be rejected
        assertThat(limiter.tryAcquire(key, 5, window, now)).isFalse();
    }

    @Test
    void limitResetsAfterWindowExpires() {
        String key = "test:127.0.0.1";
        Duration window = Duration.ofSeconds(10);
        long now = 1_000_000L;

        for (int i = 0; i < 3; i++) {
            assertThat(limiter.tryAcquire(key, 3, window, now)).isTrue();
        }
        assertThat(limiter.tryAcquire(key, 3, window, now)).isFalse();

        // Advance beyond window (10 seconds = 10,000 ms)
        long afterWindow = now + 10_001L;
        assertThat(limiter.tryAcquire(key, 3, window, afterWindow)).isTrue();
    }

    @Test
    void independentKeysDoNotInterfere() {
        Duration window = Duration.ofMinutes(1);
        long now = 1_000_000L;

        for (int i = 0; i < 3; i++) {
            assertThat(limiter.tryAcquire("key1", 3, window, now)).isTrue();
        }
        assertThat(limiter.tryAcquire("key1", 3, window, now)).isFalse();

        // key2 should have full allowance
        assertThat(limiter.tryAcquire("key2", 3, window, now)).isTrue();
    }

    @Test
    void retryAfterCalculation() {
        String key = "test:127.0.0.1";
        Duration window = Duration.ofSeconds(60);
        long now = 1_000_000L;

        limiter.tryAcquire(key, 2, window, now);
        limiter.tryAcquire(key, 2, window, now + 10_000L);

        // Rejected at now + 20_000
        long current = now + 20_000L;
        assertThat(limiter.tryAcquire(key, 2, window, current)).isFalse();

        // Oldest request was at `now`. It expires at `now + 60_000`.
        // Relative to `current` (now + 20_000), retry-after is 40_000 ms.
        long retryAfter = limiter.getRetryAfterMillis(key, window, current);
        assertThat(retryAfter).isEqualTo(40_000L);
    }

    @Test
    void concurrentRequestsEnforceLimitExactly() throws InterruptedException {
        String key = "concurrent:127.0.0.1";
        int limit = 10;
        Duration window = Duration.ofMinutes(1);
        long now = 1_000_000L;

        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    if (limiter.tryAcquire(key, limit, window, now)) {
                        successCount.incrementAndGet();
                    } else {
                        rejectedCount.incrementAndGet();
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

        assertThat(successCount.get()).isEqualTo(limit);
        assertThat(rejectedCount.get()).isEqualTo(threadCount - limit);
    }

    @Test
    void evictExpiredRemovesIdleBuckets() {
        String key = "idle:127.0.0.1";
        Duration window = Duration.ofSeconds(10);
        long now = 1_000_000L;

        limiter.tryAcquire(key, 5, window, now);
        // Eviction with threshold of 30s when time is now + 40s
        limiter.evictExpired(Duration.ofSeconds(30), now + 40_000L);

        // After eviction, retryAfter is 0 and key is clean
        assertThat(limiter.getRetryAfterMillis(key, window, now + 40_000L)).isEqualTo(0L);
    }
}
