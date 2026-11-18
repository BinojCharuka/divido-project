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
import java.util.Arrays;
import java.util.Set;
import java.util.regex.Pattern;
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
    private static final String RESET_REQUEST_PATH = "/api/v1/auth/password-reset/request";
    private static final String RESET_CONFIRM_PATH = "/api/v1/auth/password-reset/confirm";
    private static final String PASSWORD_CHANGE_PATH = "/api/v1/profile/password";
    private static final String PROFILE_PATH = "/api/v1/profile";

    // Strict IPv4 literal: 4 decimal octets 0-255, no leading zeroes unless single digit '0'
    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
                    + "(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
                    + "(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
                    + "(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$"
    );

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
        String method = request.getMethod();
        String endpointKey;
        RateLimitProperties.Policy policy;
        if (HttpMethod.POST.matches(method) && LOGIN_PATH.equals(path)) {
            endpointKey = "login";
            policy = properties.getLogin();
        } else if (HttpMethod.POST.matches(method) && REGISTER_PATH.equals(path)) {
            endpointKey = "register";
            policy = properties.getRegister();
        } else if (HttpMethod.POST.matches(method) && RESET_REQUEST_PATH.equals(path)) {
            endpointKey = "reset-request";
            policy = properties.getPasswordReset();
        } else if (HttpMethod.POST.matches(method) && RESET_CONFIRM_PATH.equals(path)) {
            endpointKey = "reset-confirm";
            policy = properties.getPasswordReset();
        } else if ((HttpMethod.POST.matches(method) && PASSWORD_CHANGE_PATH.equals(path))
                || (HttpMethod.DELETE.matches(method) && PROFILE_PATH.equals(path))) {
            // One bucket for both: each checks the account password (DEC-043, DEC-046).
            endpointKey = "password-check";
            policy = properties.getPasswordCheck();
        } else {
            endpointKey = null;
            policy = null;
        }

        if (endpointKey != null) {
            String clientIp = resolveClientIp(request);

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
     * 4. The first untrusted IP encountered is selected as the client IP, provided it is a strictly valid IP literal.
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
                // Malformed or invalid IP literal: reject trusting and fallback to immediate remote address
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
     * Checks if a candidate string is a strictly valid IPv4 or IPv6 address literal
     * without performing any DNS or name service resolution.
     */
    public static boolean isValidIpLiteral(String candidate) {
        if (candidate == null || candidate.isEmpty() || candidate.length() > 45) {
            return false;
        }

        // Reject any characters outside valid IPv4 / IPv6 hex and separator sets
        for (int i = 0; i < candidate.length(); i++) {
            char c = candidate.charAt(i);
            boolean isHex = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
            if (!isHex && c != '.' && c != ':') {
                return false;
            }
        }

        if (candidate.indexOf(':') != -1) {
            return isValidIPv6Literal(candidate);
        } else if (candidate.indexOf('.') != -1) {
            return isValidIPv4Literal(candidate);
        }

        return false;
    }

    private static boolean isValidIPv4Literal(String candidate) {
        return IPV4_PATTERN.matcher(candidate).matches();
    }

    private static boolean isValidIPv6Literal(String candidate) {
        if (candidate.contains(":::")) {
            return false;
        }

        if (candidate.startsWith(":") && !candidate.startsWith("::")) {
            return false;
        }
        if (candidate.endsWith(":") && !candidate.endsWith("::")) {
            return false;
        }

        int doubleColon = candidate.indexOf("::");
        if (doubleColon != -1) {
            // Only one double colon allowed
            if (candidate.indexOf("::", doubleColon + 2) != -1) {
                return false;
            }
        }

        // Handle possible embedded IPv4 address (e.g. ::ffff:192.0.2.1)
        int lastColon = candidate.lastIndexOf(':');
        String lastSegment = candidate.substring(lastColon + 1);
        boolean hasEmbeddedIPv4 = lastSegment.indexOf('.') != -1;

        if (hasEmbeddedIPv4) {
            if (!isValidIPv4Literal(lastSegment)) {
                return false;
            }
            String ipv6Prefix = candidate.substring(0, lastColon);
            if (ipv6Prefix.indexOf('.') != -1) {
                return false;
            }

            if (":".equals(ipv6Prefix) && candidate.startsWith("::")) {
                return true;
            }

            return isValidIPv6PrefixForEmbeddedIPv4(ipv6Prefix, doubleColon != -1);
        }

        // Pure IPv6 cannot contain dots
        if (candidate.indexOf('.') != -1) {
            return false;
        }

        return isValidPureIPv6(candidate, doubleColon != -1);
    }

    private static boolean isValidIPv6PrefixForEmbeddedIPv4(String prefix, boolean hasDoubleColon) {
        String[] parts = prefix.split(":", -1);
        int nonEmptyParts = 0;
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            if (part.length() > 4) {
                return false;
            }
            nonEmptyParts++;
        }

        return hasDoubleColon ? nonEmptyParts <= 5 : nonEmptyParts == 6;
    }

    private static boolean isValidPureIPv6(String candidate, boolean hasDoubleColon) {
        if ("::".equals(candidate)) {
            return true;
        }

        String[] parts = candidate.split(":", -1);

        if (!hasDoubleColon) {
            if (parts.length != 8) {
                return false;
            }
            for (String part : parts) {
                if (part.isEmpty() || part.length() > 4) {
                    return false;
                }
            }
            return true;
        }

        int nonEmptyParts = 0;
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            if (part.length() > 4) {
                return false;
            }
            nonEmptyParts++;
        }

        return nonEmptyParts >= 1 && nonEmptyParts <= 7;
    }
}
