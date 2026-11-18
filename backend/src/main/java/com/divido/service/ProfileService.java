package com.divido.service;

import com.divido.exception.FieldValidationException;
import com.divido.exception.ResourceNotFoundException;
import com.divido.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

/**
 * The signed-in user's own account (DIV-022, DIV-023, DIV-035). The user ID always
 * comes from the session.
 *
 * <ul>
 *   <li>DEC-043: only the display name and the password can change. Email, currency,
 *       timezone and language are fixed for the MVP.</li>
 *   <li>DEC-044: onboarding completion is recorded once.</li>
 *   <li>DEC-046: deletion needs the password and the word DELETE, and removes the
 *       account with all its data at once.</li>
 * </ul>
 */
@Service
public class ProfileService {

    public static final String DELETE_CONFIRMATION = "DELETE";

    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public ProfileService(AccountRepository accounts, PasswordEncoder passwordEncoder, Clock clock) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public AccountRepository.Profile get(UUID userId) {
        return accounts.findProfile(userId).orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    @Transactional
    public AccountRepository.Profile updateDisplayName(UUID userId, String displayName) {
        accounts.updateDisplayName(userId, displayName, clock.instant());
        return get(userId);
    }

    @Transactional
    public AccountRepository.Profile completeOnboarding(UUID userId) {
        accounts.markOnboardingComplete(userId, clock.instant());
        return get(userId);
    }

    /**
     * @return the new credentials version, for the caller to keep the current session
     * @throws FieldValidationException when the current password is wrong or the new
     *         one is not allowed
     */
    @Transactional
    public int changePassword(UUID userId, String currentPassword, String newPassword) {
        PasswordRules.checkLength("newPassword", newPassword);
        AccountRepository.Credentials account = accounts.findCredentials(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (!PasswordRules.fitsBcrypt(currentPassword)
                || !passwordEncoder.matches(currentPassword, account.passwordHash())) {
            throw new FieldValidationException("currentPassword", "The current password is incorrect.");
        }
        if (passwordEncoder.matches(newPassword, account.passwordHash())) {
            throw new FieldValidationException("newPassword", "Choose a password different from your current one.");
        }
        return accounts.replacePassword(userId, passwordEncoder.encode(newPassword), clock.instant())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    /**
     * @throws FieldValidationException when the confirmation word or the password is wrong
     */
    @Transactional
    public void deleteAccount(UUID userId, String password, String confirmation) {
        if (confirmation == null || !DELETE_CONFIRMATION.equals(confirmation.strip())) {
            throw new FieldValidationException("confirmation", "Type DELETE to confirm.");
        }
        AccountRepository.Credentials account = accounts.findCredentials(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (!PasswordRules.fitsBcrypt(password) || !passwordEncoder.matches(password, account.passwordHash())) {
            throw new FieldValidationException("password", "The password is incorrect.");
        }
        accounts.deleteAccount(userId);
    }
}
