package com.KeyStone.Field.DTO;

import com.KeyStone.Field.ENUM.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String userName;
    private String email;
    private Role role;
    private Boolean active;
}
