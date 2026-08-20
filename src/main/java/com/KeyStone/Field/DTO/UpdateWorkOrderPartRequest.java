package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkOrderPartRequest {

    @NotNull
    @PositiveOrZero
    private Integer usedQuantity;
}