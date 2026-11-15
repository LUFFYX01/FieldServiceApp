package com.KeyStone.Field.Security;

import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.enums.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser()
                .map(User::getEmail)
                .orElse("SYSTEM");
    }

    public static boolean isCurrentUserTechnician() {
        return getCurrentUser()
                .map(u -> u.getRole() == Role.TECHNICIAN)
                .orElse(false);
    }

    public static boolean isCurrentUserAdmin() {
        return getCurrentUser()
                .map(u -> u.getRole() == Role.ADMIN)
                .orElse(false);
    }
}
