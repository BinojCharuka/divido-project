package com.divido.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding-window rate limiter storing request timestamps in memory per key.
 * Expired entries are evicted lazily during access and during periodic maintenance.
 */
public class SlidingWindowRateLimiter {

    private final Map<String, Deque<Long>> requestWindows = new ConcurrentHashMap<>();

    /**
     * Attempts to acquire permission for the specified key under the given limit and window.
     *
     * @param key the unique bucket identifier (e.g. IP + endpoint)
     * @param limit maximum allowed requests within the duration window
     * @param window duration window for the limit
     * @param nowMs current timestamp in milliseconds
     * @return true if the request is permitted, false if rate limited
     */
    public boolean tryAcquire(String key, int limit, Duration window, long nowMs) {
        long windowStartMs = nowMs - window.toMillis();

        Deque<Long> timestamps = requestWindows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            // Evict timestamps outside the sliding window
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= windowStartMs) {
                timestamps.pollFirst();
            }

            if (timestamps.size() < limit) {
                timestamps.addLast(nowMs);
                return true;
            } else {
                return false;
            }
        }
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
        Deque<Long> timestamps = requestWindows.get(key);
        if (timestamps == null) {
            return 0L;
        }
        synchronized (timestamps) {
            if (timestamps.isEmpty()) {
                return 0L;
            }
            long oldestTimestamp = timestamps.peekFirst();
            long availableAt = oldestTimestamp + window.toMillis();
            return Math.max(0L, availableAt - nowMs);
        }
    }

    /**
     * Resets all rate limit tracking buckets (useful for tests).
     */
    public void reset() {
        requestWindows.clear();
    }

    /**
     * Evicts buckets that have had no activity within the eviction threshold.
     *
     * @param maxIdleThreshold duration after which an idle bucket is purged
     * @param nowMs current timestamp in milliseconds
     */
    public void evictExpired(Duration maxIdleThreshold, long nowMs) {
        long cutoff = nowMs - maxIdleThreshold.toMillis();
        Iterator<Map.Entry<String, Deque<Long>>> iterator = requestWindows.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Deque<Long>> entry = iterator.next();
            Deque<Long> deque = entry.getValue();
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst() <= cutoff) {
                    deque.pollFirst();
                }
                if (deque.isEmpty()) {
                    iterator.remove();
                }
            }
        }
    }
}
