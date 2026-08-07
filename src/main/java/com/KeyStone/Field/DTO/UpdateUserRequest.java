package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @NotBlank
    private String userName;

    @Email
    @NotBlank
    private String email;

    @NotNull
    private Role role;
}
