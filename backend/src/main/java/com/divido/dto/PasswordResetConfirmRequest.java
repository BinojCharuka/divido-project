package com.divido.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** AUTH-008 (DEC-045). The token comes from the emailed link. */
public record PasswordResetConfirmRequest(
        @NotBlank(message = "This reset link is invalid or has expired. Request a new one.")
        String token,

        @NotBlank(message = "Enter a new password.")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters.")
        String newPassword
) {
}
