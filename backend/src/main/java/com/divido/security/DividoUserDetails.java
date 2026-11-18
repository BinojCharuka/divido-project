package com.divido.security;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * The signed-in user kept in the session. The password hash is erased after
 * authentication, so the session holds only the ID, email and the account's
 * credentials version at sign-in. {@link SessionCredentialsFilter} ends the session
 * once that version is out of date (password changed or reset, DEC-043, DEC-045).
 */
public final class DividoUserDetails implements UserDetails, CredentialsContainer {

    @Serial
    private static final long serialVersionUID = 2L;

    private final UUID id;
    private final String email;
    private final int credentialsVersion;
    private String passwordHash;

    public DividoUserDetails(UUID id, String email, String passwordHash, int credentialsVersion) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.credentialsVersion = credentialsVersion;
    }

    public int getCredentialsVersion() {
        return credentialsVersion;
    }

    public UUID getId() {
        return id;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }
}
