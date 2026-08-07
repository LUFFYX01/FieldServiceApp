package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.Customer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository <Customer,Long> {


    boolean existsByEmail(@NotBlank @Email String email);

    boolean existsByEmailAndIdNot(@Email @NotBlank String email, Long id);
}
