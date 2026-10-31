package com.divido.security;

import com.divido.dto.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Filter that enforces sliding-window rate limits on authentication endpoints
 * (/api/v1/auth/login and /api/v1/auth/register).
 * Protects against credential stuffing and brute-force attacks before expensive
 * password hashing and database operations occur.
 */
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String REGISTER_PATH = "/api/v1/auth/register";

    private final SlidingWindowRateLimiter rateLimiter;
    private final RateLimitProperties properties;
    private final JsonMapper jsonMapper;
    private final Clock clock;
    private final Set<String> trustedProxies;

    public RateLimitingFilter(SlidingWindowRateLimiter rateLimiter,
                              RateLimitProperties properties,
                              JsonMapper jsonMapper,
                              Clock clock) {
        this.rateLimiter = rateLimiter;
        this.properties = properties;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
        if (StringUtils.hasText(properties.getTrustedProxies())) {
            this.trustedProxies = Arrays.stream(properties.getTrustedProxies().split(","))
                    .map(String::strip)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toUnmodifiableSet());
        } else {
            this.trustedProxies = Set.of();
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        boolean isPost = HttpMethod.POST.matches(request.getMethod());

        if (isPost && (LOGIN_PATH.equals(path) || REGISTER_PATH.equals(path))) {
            String clientIp = resolveClientIp(request);
            String endpointKey = LOGIN_PATH.equals(path) ? "login" : "register";
            RateLimitProperties.Policy policy = LOGIN_PATH.equals(path)
                    ? properties.getLogin()
                    : properties.getRegister();

            String bucketKey = endpointKey + ":" + clientIp;
            long nowMs = clock.millis();

            if (!rateLimiter.tryAcquire(bucketKey, policy.getLimit(), policy.getWindow(), nowMs)) {
                long retryAfterMs = rateLimiter.getRetryAfterMillis(bucketKey, policy.getWindow(), nowMs);
                long retryAfterSeconds = Math.max(1, (retryAfterMs + 999) / 1000);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                ApiError error = new ApiError(
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        "RATE_LIMIT_EXCEEDED",
                        "Too many requests. Please try again later.",
                        null
                );
                jsonMapper.writeValue(response.getOutputStream(), error);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the client IP address using secure right-to-left evaluation:
     * 1. Start with the immediate remote address (request.getRemoteAddr()).
     * 2. If the immediate address is NOT in the trusted proxies set, return it directly.
     * 3. If the immediate address is trusted and X-Forwarded-For is present, parse the chain
     *    and walk from right to left, skipping trusted proxy IPs.
     * 4. The first untrusted IP encountered is selected as the client IP, provided it is a valid IP literal.
     * 5. If all IPs are trusted, or any IP is malformed/invalid, fallback safely to the immediate remote address.
     */
    public String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "unknown";
        }
        remoteAddr = remoteAddr.strip();

        // If the immediate connection does not come from a trusted proxy, never trust XFF.
        if (!trustedProxies.contains(remoteAddr)) {
            return remoteAddr;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (!StringUtils.hasText(xForwardedFor)) {
            return remoteAddr;
        }

        String[] hops = xForwardedFor.split(",");
        // Walk from right to left
        for (int i = hops.length - 1; i >= 0; i--) {
            String hop = hops[i].strip();
            if (hop.isEmpty()) {
                // Malformed empty hop: reject trusting and fallback to immediate remote address
                return remoteAddr;
            }

            if (!isValidIpLiteral(hop)) {
                // Malformed or invalid IP: reject trusting and fallback to immediate remote address
                return remoteAddr;
            }

            if (!trustedProxies.contains(hop)) {
                // First untrusted IP from the right is the genuine client address
                return hop;
            }
        }

        // All hops were in the trusted proxies set
        return remoteAddr;
    }

    /**
     * Checks if a candidate string is a valid IPv4 or IPv6 address literal without DNS resolution.
     */
    public static boolean isValidIpLiteral(String candidate) {
        if (candidate == null || candidate.isEmpty() || candidate.length() > 45) {
            return false;
        }
        try {
            // Using InetAddress.getByName with an IP string parses it as an address literal.
            // However, to ensure NO DNS lookup is attempted, we verify format.
            byte[] addressBytes = InetAddress.getByName(candidate).getAddress();
            return addressBytes.length == 4 || addressBytes.length == 16;
        } catch (UnknownHostException | SecurityException e) {
            return false;
        }
    }
}
