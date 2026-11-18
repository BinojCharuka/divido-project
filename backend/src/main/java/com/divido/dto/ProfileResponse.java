package com.divido.dto;

import com.divido.repository.AccountRepository;

import java.util.UUID;

/**
 * PROFILE-001. Currency, timezone and language are shown but fixed for the MVP
 * (DEC-043); only {@code displayName} can change.
 */
public record ProfileResponse(UUID id, String email, String displayName, String currency, String timeZone,
        String locale, boolean onboardingComplete) {

    /** DEC-009: English only. */
    public static final String LOCALE = "en";

    public static ProfileResponse from(AccountRepository.Profile profile) {
        return new ProfileResponse(profile.id(), profile.email(), profile.displayName(), profile.currency(),
                profile.timezone(), LOCALE, profile.onboardingComplete());
    }
}
