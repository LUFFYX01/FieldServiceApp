package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    boolean existsByEmail(@NotBlank @Email String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    Optional<User> findByEmail(String email);
}
