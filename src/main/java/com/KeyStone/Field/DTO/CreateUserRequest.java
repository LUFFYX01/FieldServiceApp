package com.KeyStone.Field.DTO;

import com.KeyStone.Field.ENUM.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {

    @NotBlank
    private String userName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    @NotNull
    private Role role;
}

