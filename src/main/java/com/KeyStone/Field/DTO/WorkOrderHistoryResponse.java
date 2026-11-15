package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.WorkOrderStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderHistoryResponse {

    private Long id;

    private Long workOrderId;

    private WorkOrderStatus status;

    private String description;

    private LocalDateTime createdAt;
}