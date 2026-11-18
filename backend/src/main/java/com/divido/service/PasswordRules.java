package com.divido.service;

import com.divido.exception.FieldValidationException;

import java.nio.charset.StandardCharsets;

/**
 * Password rules shared by registration, password change and reset: 8 to 72
 * characters (checked on the request DTOs) and at most 72 bytes in UTF-8, the BCrypt
 * input limit.
 */
final class PasswordRules {

    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private PasswordRules() {
    }

    static boolean fitsBcrypt(String password) {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_PASSWORD_BYTES;
    }

    /** @throws FieldValidationException on {@code field} when the password is too long */
    static void checkLength(String field, String password) {
        if (!fitsBcrypt(password)) {
            throw new FieldValidationException(field, "Password is too long.");
        }
    }
}
