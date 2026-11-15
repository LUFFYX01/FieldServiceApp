package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianStatusUpdateRequest {

    @NotNull(message = "Status cannot be null")
    private WorkOrderStatus status;

    private String notes;
}
