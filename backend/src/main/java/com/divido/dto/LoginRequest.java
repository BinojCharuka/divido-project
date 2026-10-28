package com.divido.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/**
 * Sign-in payload. The email is normalized exactly as at registration (DEC-023);
 * the password is never altered.
 */
public record LoginRequest(
        @NotBlank(message = "Enter an email address.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 255, message = "Email must be at most 255 characters.")
        String email,

        @NotBlank(message = "Enter a password.")
        String password
) {

    public LoginRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
