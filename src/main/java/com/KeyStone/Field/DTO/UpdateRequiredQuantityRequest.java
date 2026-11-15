package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequiredQuantityRequest {

    @NotNull(message = "Required quantity cannot be null")
    @Min(value = 1, message = "Required quantity must be at least 1")
    private Integer requiredQuantity;
}
