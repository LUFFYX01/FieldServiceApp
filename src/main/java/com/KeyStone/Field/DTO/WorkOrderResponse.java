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
public class WorkOrderResponse {

    private Long id;
    private String title;
    private String description;

    private WorkOrderStatus status;
    private WorkOrderPriority priority;

    private Long customerId;
    private String customerName;

    private Long technicianId;
    private String technicianName;

    private LocalDateTime createdAt;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedDate;

    private String notes;

    private Long siteId;
    private String siteName;
    private String siteAddress;
}