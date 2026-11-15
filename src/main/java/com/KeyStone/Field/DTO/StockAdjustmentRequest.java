package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentRequest {

    @NotNull(message = "Adjustment quantity cannot be null")
    private Integer quantity;

    @NotBlank(message = "Reason is required")
    private String reason;
}
