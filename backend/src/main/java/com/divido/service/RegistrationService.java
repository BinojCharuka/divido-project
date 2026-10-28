package com.divido.service;

import com.divido.dto.RegisterRequest;
import com.divido.entity.AppUser;
import com.divido.exception.DuplicateEmailException;
import com.divido.exception.FieldValidationException;
import com.divido.repository.AppUserRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class RegistrationService {

    /** Name PostgreSQL gives the {@code email ... UNIQUE} constraint in V1__init.sql. */
    static final String EMAIL_UNIQUE_CONSTRAINT = "app_users_email_key";

    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Relies on the database unique constraint rather than a pre-check, so two
     * concurrent registrations for one email cannot both succeed.
     */
    public AppUser register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new FieldValidationException("password", "Password is too long.");
        }

        AppUser user = new AppUser(request.email(), passwordEncoder.encode(request.password()), request.displayName());
        try {
            return users.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            if (ex.getCause() instanceof ConstraintViolationException cve
                    && EMAIL_UNIQUE_CONSTRAINT.equals(cve.getConstraintName())) {
                throw new DuplicateEmailException(ex);
            }
            throw ex;
        }
    }
}
