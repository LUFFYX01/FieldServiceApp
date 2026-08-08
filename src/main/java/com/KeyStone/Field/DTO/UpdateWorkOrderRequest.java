package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.WorkOrderPriority;
import com.KeyStone.Field.enums.WorkOrderStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkOrderRequest {

    private WorkOrderStatus status;

    private WorkOrderPriority priority;

    private LocalDateTime scheduledDate;

    private LocalDateTime completedDate;

    private String notes;
}