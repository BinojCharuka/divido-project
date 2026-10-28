package com.divido.dto;

import java.util.UUID;

/**
 * Public user representation from the proposed OpenAPI {@code AuthUserResponse}.
 * Credentials and password hashes are never part of this type.
 */
public record AuthUserResponse(AuthUser user) {

    public record AuthUser(UUID id, String email, boolean onboardingComplete) {
    }
}
