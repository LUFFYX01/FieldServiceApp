package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(@NotBlank @Email String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    Optional<User> findByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByRoleAndActiveTrue(Role role);

    long countByRoleAndActiveTrue(Role role);

    List<User> findByActive(Boolean active);
}
