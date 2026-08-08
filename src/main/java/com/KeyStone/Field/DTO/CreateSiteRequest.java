package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSiteRequest {

    @NotBlank
    private String siteName;

    @NotBlank
    private String address;

    @NotBlank
    private String contactPerson;

    @NotBlank
    private String phone;

    @NotNull
    private Long customerId;
}