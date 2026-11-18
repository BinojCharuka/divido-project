package com.divido.exception;

/**
 * A reset token that is unknown, malformed, expired or already used. One neutral
 * error for all of them, so a response never says which (DEC-045).
 */
public class PasswordResetInvalidException extends RuntimeException {

    public PasswordResetInvalidException() {
        super("This reset link is invalid or has expired. Request a new one.");
    }
}
