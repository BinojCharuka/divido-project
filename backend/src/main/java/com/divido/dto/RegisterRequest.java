package com.divido.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/**
 * Registration payload. Email is trimmed and lower-cased and the display name is
 * trimmed before validation, so the limits apply to the values that are stored.
 * The password is never altered. A password must also fit BCrypt's 72-byte input
 * limit, which RegistrationService checks in UTF-8.
 */
public record RegisterRequest(
        @NotBlank(message = "Enter an email address.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 255, message = "Email must be at most 255 characters.")
        String email,

        @NotBlank(message = "Enter a password.")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters.")
        String password,

        @NotBlank(message = "Enter a display name.")
        @Size(max = 100, message = "Display name must be at most 100 characters.")
        // PostgreSQL text columns cannot store U+0000; reject it here instead of failing on insert.
        @Pattern(regexp = "[^\\u0000]*", message = "Display name contains an unsupported character.")
        String displayName
) {

    public RegisterRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        displayName = displayName == null ? null : displayName.strip();
    }
}
