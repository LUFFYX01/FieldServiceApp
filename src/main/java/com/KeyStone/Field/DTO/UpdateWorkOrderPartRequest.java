package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkOrderPartRequest {

    @NotNull(message = "Used quantity cannot be null")
    @Min(value = 0, message = "Used quantity cannot be negative")
    private Integer usedQuantity;
}
