package com.divido.security;

import com.divido.repository.AppUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Looks up accounts by the normalized email (DEC-023); LoginRequest normalizes it. */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository users;

    public AppUserDetailsService(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return users.findByEmail(email)
                .map(user -> new DividoUserDetails(user.getId(), user.getEmail(), user.getPasswordHash()))
                // The message never includes the email.
                .orElseThrow(() -> new UsernameNotFoundException("No matching account"));
    }
}
