package com.divido.service;

import com.divido.exception.PasswordResetInvalidException;
import com.divido.repository.AccountRepository;
import com.divido.repository.PasswordResetTokenRepository;
import com.divido.security.SlidingWindowRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Forgot-password flow (DIV-029, DEC-045).
 *
 * <ul>
 *   <li>Tokens are 256 random bits, sent only in the email; the database keeps their
 *       SHA-256 hash. They expire after 30 minutes, work once, and a new request voids
 *       older ones.</li>
 *   <li>A request always returns the same neutral reply. Unknown emails, and emails
 *       already sent three links in ten minutes, are dropped silently.</li>
 *   <li>A successful reset increments the credentials version, which ends every
 *       session of the account.</li>
 * </ul>
 * The link carries the token in the URL fragment ({@code #token=}), which browsers do
 * not send to servers or in the Referer header.
 */
@Service
public class PasswordResetService {

    public static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);
    private static final int PER_EMAIL_LIMIT = 3;
    private static final Duration PER_EMAIL_WINDOW = Duration.ofMinutes(10);
    private static final int TOKEN_BYTES = 32;
    /** 32 bytes in unpadded base64url. */
    private static final Pattern TOKEN_FORMAT = Pattern.compile("[A-Za-z0-9_-]{43}");

    private final AccountRepository accounts;
    private final PasswordResetTokenRepository tokens;
    private final PasswordResetMailer mailer;
    private final PasswordEncoder passwordEncoder;
    private final SlidingWindowRateLimiter rateLimiter;
    private final Clock clock;
    private final String publicUrl;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(AccountRepository accounts, PasswordResetTokenRepository tokens,
            PasswordResetMailer mailer, PasswordEncoder passwordEncoder, SlidingWindowRateLimiter rateLimiter,
            Clock clock, @Value("${divido.app.public-url:http://localhost:3000}") String publicUrl) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.mailer = mailer;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
        this.clock = clock;
        this.publicUrl = validatedPublicUrl(publicUrl);
    }

    /** @param normalizedEmail trimmed and lower-cased (DEC-023) */
    @Transactional
    public void request(String normalizedEmail) {
        Instant now = clock.instant();
        String emailKey = "reset-email:" + sha256Hex(normalizedEmail);
        if (!rateLimiter.tryAcquire(emailKey, PER_EMAIL_LIMIT, PER_EMAIL_WINDOW, now.toEpochMilli())) {
            return;
        }
        Optional<AccountRepository.Credentials> account = accounts.findCredentialsByEmail(normalizedEmail);
        if (account.isEmpty()) {
            return;
        }
        byte[] raw = new byte[TOKEN_BYTES];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        tokens.replaceForUser(account.get().id(), sha256Hex(token), now, now.plus(TOKEN_LIFETIME));
        mailer.send(account.get().email(), account.get().displayName(),
                publicUrl + "/reset-password#token=" + token, TOKEN_LIFETIME);
    }

    /**
     * @throws PasswordResetInvalidException for any token that cannot be used
     */
    @Transactional
    public void confirm(String token, String newPassword) {
        PasswordRules.checkLength("newPassword", newPassword);
        if (token == null || !TOKEN_FORMAT.matcher(token).matches()) {
            throw new PasswordResetInvalidException();
        }
        Instant now = clock.instant();
        UUID userId = tokens.consume(sha256Hex(token), now).orElseThrow(PasswordResetInvalidException::new);
        accounts.replacePassword(userId, passwordEncoder.encode(newPassword), now)
                .orElseThrow(PasswordResetInvalidException::new);
        tokens.deleteForUser(userId);
    }

    static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private static String validatedPublicUrl(String configured) {
        String url = configured == null ? "" : configured.strip();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        if (!url.matches("https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?")) {
            throw new IllegalStateException("divido.app.public-url must be an http(s) URL such as https://app.example.com");
        }
        return url;
    }
}
