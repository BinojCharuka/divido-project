package com.divido.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding-window rate limiter storing request timestamps in memory per key.
 * Uses atomic per-key computation to coordinate map membership and bucket mutation,
 * ensuring no request can update a detached bucket or bypass limits during concurrent eviction.
 */
public class SlidingWindowRateLimiter {

    private final Map<String, Deque<Long>> requestWindows = new ConcurrentHashMap<>();

    // Package-private hooks for deterministic concurrency regression testing
    volatile java.util.function.Consumer<String> onAcquireInFlight;
    volatile java.util.function.Consumer<String> onEvictInFlight;

    /**
     * Attempts to acquire permission for the specified key under the given limit and window.
     * Atomically coordinates map membership and bucket mutation using ConcurrentHashMap.compute().
     *
     * @param key the unique bucket identifier (e.g. IP + endpoint)
     * @param limit maximum allowed requests within the duration window
     * @param window duration window for the limit
     * @param nowMs current timestamp in milliseconds
     * @return true if the request is permitted, false if rate limited
     */
    public boolean tryAcquire(String key, int limit, Duration window, long nowMs) {
        long windowStartMs = nowMs - window.toMillis();
        boolean[] acquired = new boolean[1];

        requestWindows.compute(key, (k, existingDeque) -> {
            if (onAcquireInFlight != null) {
                onAcquireInFlight.accept(k);
            }

            Deque<Long> deque = (existingDeque != null) ? existingDeque : new ArrayDeque<>();

            // Evict timestamps outside the sliding window
            while (!deque.isEmpty() && deque.peekFirst() <= windowStartMs) {
                deque.pollFirst();
            }

            if (deque.size() < limit) {
                deque.addLast(nowMs);
                acquired[0] = true;
            } else {
                acquired[0] = false;
            }

            return deque.isEmpty() ? null : deque;
        });

        return acquired[0];
    }

    /**
     * Calculates the remaining cooldown in milliseconds until at least one request token becomes available.
     *
     * @param key the bucket identifier
     * @param window duration window
     * @param nowMs current timestamp in milliseconds
     * @return milliseconds until next availability, or 0 if currently available
     */
    public long getRetryAfterMillis(String key, Duration window, long nowMs) {
        long[] retryAfter = new long[1];

        requestWindows.computeIfPresent(key, (k, deque) -> {
            if (!deque.isEmpty()) {
                long oldestTimestamp = deque.peekFirst();
                long availableAt = oldestTimestamp + window.toMillis();
                retryAfter[0] = Math.max(0L, availableAt - nowMs);
            }
            return deque;
        });

        return retryAfter[0];
    }

    /**
     * Resets all rate limit tracking buckets (useful for tests).
     */
    public void reset() {
        requestWindows.clear();
    }

    /**
     * Returns the current number of tracked bucket entries.
     */
    public int getBucketCount() {
        return requestWindows.size();
    }

    /**
     * Evicts buckets that have had no activity within the eviction threshold.
     * Uses atomic computeIfPresent to inspect and conditionally remove buckets from the map,
     * ensuring no request thread can obtain a detached reference or race with eviction.
     *
     * @param maxIdleThreshold duration after which an idle bucket is purged
     * @param nowMs current timestamp in milliseconds
     */
    public void evictExpired(Duration maxIdleThreshold, long nowMs) {
        long cutoff = nowMs - maxIdleThreshold.toMillis();
        for (String key : requestWindows.keySet()) {
            requestWindows.computeIfPresent(key, (k, deque) -> {
                if (onEvictInFlight != null) {
                    onEvictInFlight.accept(k);
                }
                while (!deque.isEmpty() && deque.peekFirst() <= cutoff) {
                    deque.pollFirst();
                }
                // Returning null atomically removes the key from the ConcurrentHashMap
                return deque.isEmpty() ? null : deque;
            });
        }
    }
}
