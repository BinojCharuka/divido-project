package com.divido.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PROFILE-002. Only the display name is editable (DEC-043); any other field in the
 * body is ignored (DEC-026). Same rule as at registration (DEC-021).
 */
public record ProfileUpdateRequest(
        @NotBlank(message = "Enter a display name.")
        @Size(max = 100, message = "Display name must be at most 100 characters.")
        @Pattern(regexp = "[^\\u0000]*", message = "Display name contains an unsupported character.")
        String displayName
) {

    public ProfileUpdateRequest {
        displayName = displayName == null ? null : displayName.strip();
    }
}
