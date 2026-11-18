package com.divido.security;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Configuration properties for authentication endpoint rate limiting.
 */
@ConfigurationProperties(prefix = "divido.rate-limit")
@Validated
public class RateLimitProperties {

    /**
     * Whether rate limiting on authentication endpoints is enabled.
     */
    private boolean enabled = true;

    /**
     * Comma-separated list or single IP address of trusted proxies (e.g., reverse proxy / ingress).
     * If empty, X-Forwarded-For is ignored and request.getRemoteAddr() is used.
     */
    private String trustedProxies = "";

    /**
     * Rate limit policy for login (POST /api/v1/auth/login).
     */
    @Valid
    @NotNull
    private Policy login = new Policy(10, Duration.ofMinutes(1));

    /**
     * Rate limit policy for registration (POST /api/v1/auth/register).
     */
    @Valid
    @NotNull
    private Policy register = new Policy(10, Duration.ofMinutes(1));

    /**
     * Rate limit policy for password reset request and confirm (DEC-045), per endpoint.
     */
    @Valid
    @NotNull
    private Policy passwordReset = new Policy(5, Duration.ofMinutes(1));

    /**
     * Rate limit policy for requests that check the account password: password change
     * (POST /api/v1/profile/password) and account deletion (DELETE /api/v1/profile).
     */
    @Valid
    @NotNull
    private Policy passwordCheck = new Policy(10, Duration.ofMinutes(1));

    @PostConstruct
    public void validate() {
        if (login == null) {
            throw new IllegalStateException("divido.rate-limit.login policy must not be null");
        }
        login.validate("divido.rate-limit.login");

        if (register == null) {
            throw new IllegalStateException("divido.rate-limit.register policy must not be null");
        }
        register.validate("divido.rate-limit.register");
        if (passwordReset == null) {
            throw new IllegalStateException("divido.rate-limit.password-reset policy must not be null");
        }
        passwordReset.validate("divido.rate-limit.password-reset");
        if (passwordCheck == null) {
            throw new IllegalStateException("divido.rate-limit.password-check policy must not be null");
        }
        passwordCheck.validate("divido.rate-limit.password-check");
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getTrustedProxies() {
        return trustedProxies;
    }

    public void setTrustedProxies(String trustedProxies) {
        this.trustedProxies = trustedProxies;
    }

    public Policy getLogin() {
        return login;
    }

    public void setLogin(Policy login) {
        this.login = login;
    }

    public Policy getRegister() {
        return register;
    }

    public void setRegister(Policy register) {
        this.register = register;
    }

    public Policy getPasswordReset() {
        return passwordReset;
    }

    public void setPasswordReset(Policy passwordReset) {
        this.passwordReset = passwordReset;
    }

    public Policy getPasswordCheck() {
        return passwordCheck;
    }

    public void setPasswordCheck(Policy passwordCheck) {
        this.passwordCheck = passwordCheck;
    }

    public static class Policy {
        private int limit;
        private Duration window;

        public Policy() {
        }

        public Policy(int limit, Duration window) {
            this.limit = limit;
            this.window = window;
        }

        public void validate(String prefix) {
            if (limit < 1) {
                throw new IllegalStateException(prefix + ".limit must be at least 1; configured: " + limit);
            }
            if (window == null) {
                throw new IllegalStateException(prefix + ".window must not be null");
            }
            if (window.isZero() || window.isNegative()) {
                throw new IllegalStateException(prefix + ".window must be strictly positive; configured: " + window);
            }
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }
    }
}
