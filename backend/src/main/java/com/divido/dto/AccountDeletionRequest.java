package com.divido.dto;

import jakarta.validation.constraints.NotBlank;

/** PROFILE-005 (DEC-046): the account password and the word DELETE. */
public record AccountDeletionRequest(
        @NotBlank(message = "Enter your password.")
        String password,

        @NotBlank(message = "Type DELETE to confirm.")
        String confirmation
) {
}
