package com.divido.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** PROFILE-004 (DEC-043). Passwords are never altered or echoed back. */
public record PasswordChangeRequest(
        @NotBlank(message = "Enter your current password.")
        String currentPassword,

        @NotBlank(message = "Enter a new password.")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters.")
        String newPassword
) {
}
