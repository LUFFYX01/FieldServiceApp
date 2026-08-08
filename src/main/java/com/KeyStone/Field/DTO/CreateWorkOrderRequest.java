package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkOrderRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private WorkOrderPriority priority;

    @NotNull
    private Long customerId;

    @NotNull
    private Long siteId;
}