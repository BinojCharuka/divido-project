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
import java.time.Clock;
import java.time.Duration;
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
     * Resolves the client IP address. If the immediate remote address is in the configured
     * trusted proxies list, the first untrusted IP from the X-Forwarded-For header is used.
     * Otherwise, request.getRemoteAddr() is returned directly to prevent header spoofing.
     */
    public String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null) {
            remoteAddr = "unknown";
        }

        if (trustedProxies.contains(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (StringUtils.hasText(xForwardedFor)) {
                String[] parts = xForwardedFor.split(",");
                for (String part : parts) {
                    String candidate = part.strip();
                    if (StringUtils.hasText(candidate) && !trustedProxies.contains(candidate)) {
                        return candidate;
                    }
                }
            }
        }

        return remoteAddr;
    }
}
