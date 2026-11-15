package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkOrderPartRequest {

    @NotNull
    private Long partId;

    @NotNull
    @Positive
    private Integer requiredQuantity;
}