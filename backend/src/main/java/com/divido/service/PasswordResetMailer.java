package com.divido.service;

import java.time.Duration;

/**
 * Sends the password reset email (DEC-045). Implementations must never log the link
 * or the token.
 */
public interface PasswordResetMailer {

    /**
     * @param to          the account's stored email address
     * @param displayName the account's display name, for the greeting
     * @param resetLink   the single-use link, containing the token
     * @param validFor    how long the link works
     */
    void send(String to, String displayName, String resetLink, Duration validFor);
}
