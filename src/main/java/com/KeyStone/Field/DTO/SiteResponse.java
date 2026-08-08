package com.KeyStone.Field.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteResponse {

    private Long id;
    private String siteName;
    private String address;
    private String contactPerson;
    private String phone;
    private Boolean active;
    private Long customerId;
    private String customerName;
    private LocalDateTime createdAt;
}