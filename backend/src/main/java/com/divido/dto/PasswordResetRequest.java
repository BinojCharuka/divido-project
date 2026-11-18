package com.divido.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/** AUTH-007 (DEC-045). The email is normalized as at registration (DEC-023). */
public record PasswordResetRequest(
        @NotBlank(message = "Enter an email address.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 255, message = "Email must be at most 255 characters.")
        String email
) {

    public PasswordResetRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
