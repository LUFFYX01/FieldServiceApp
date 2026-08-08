package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSiteRequest {

    @NotBlank
    private String siteName;

    @NotBlank
    private String address;

    @NotBlank
    private String contactPerson;

    @NotBlank
    private String phone;

    private Boolean active;
}