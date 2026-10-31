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
        String key1 = "idle:1";
        String key2 = "idle:2";
        Duration window = Duration.ofSeconds(10);
        long now = 1_000_000L;

        limiter.tryAcquire(key1, 5, window, now);
        limiter.tryAcquire(key2, 5, window, now);
        assertThat(limiter.getBucketCount()).isEqualTo(2);

        // Eviction with threshold of 30s when time is now + 40s
        limiter.evictExpired(Duration.ofSeconds(30), now + 40_000L);

        // After eviction, both idle buckets are completely removed from memory
        assertThat(limiter.getBucketCount()).isEqualTo(0);
    }

    @Test
    void activeBucketsRemainWhileIdleBucketsAreEvicted() {
        String idleKey = "idle:old";
        String activeKey = "active:recent";
        Duration window = Duration.ofSeconds(60);
        long now = 1_000_000L;

        // idleKey acquired at now
        limiter.tryAcquire(idleKey, 5, window, now);
        // activeKey acquired at now + 50s
        limiter.tryAcquire(activeKey, 5, window, now + 50_000L);
        assertThat(limiter.getBucketCount()).isEqualTo(2);

        // Eviction at now + 65s with 60s idle threshold
        // idleKey is 65s old (> 60s) -> evicted
        // activeKey is 15s old (< 60s) -> preserved
        limiter.evictExpired(Duration.ofSeconds(60), now + 65_000L);

        assertThat(limiter.getBucketCount()).isEqualTo(1);
        assertThat(limiter.tryAcquire(activeKey, 5, window, now + 65_000L)).isTrue();
    }

    @Test
    void concurrentAcquisitionAndEvictionDoesNotCorruptOrBypass() throws InterruptedException {
        int threadCount = 10;
        int operationsPerThread = 200;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount + 2);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger totalAcquisitions = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();

        // 10 worker threads acquiring for distinct and shared keys
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            futures.add(executor.submit(() -> {
                try {
                    startLatch.await();
                    for (int op = 0; op < operationsPerThread; op++) {
                        String key = "thread-" + (threadId % 3) + ":ip-" + (op % 5);
                        if (limiter.tryAcquire(key, 5, Duration.ofMillis(50), System.currentTimeMillis())) {
                            totalAcquisitions.incrementAndGet();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
        }

        // 2 background eviction threads running concurrently
        for (int i = 0; i < 2; i++) {
            futures.add(executor.submit(() -> {
                try {
                    startLatch.await();
                    for (int j = 0; j < 50; j++) {
                        limiter.evictExpired(Duration.ofMillis(10), System.currentTimeMillis());
                        Thread.sleep(5);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
        }

        startLatch.countDown();

        for (Future<?> f : futures) {
            try {
                f.get();
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
        }
        executor.shutdown();

        // Verification: executions completed without exceptions, deadlocks, or state corruption
        assertThat(totalAcquisitions.get()).isGreaterThan(0);
    }
}
