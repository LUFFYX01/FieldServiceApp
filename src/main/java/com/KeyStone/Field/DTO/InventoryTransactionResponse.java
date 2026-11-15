package com.KeyStone.Field.DTO;

import com.KeyStone.Field.enums.InventoryTransactionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionResponse {

    private Long id;
    private Long partId;
    private String partName;
    private String partNumber;
    private InventoryTransactionType transactionType;
    private Integer quantityChanged;
    private Integer previousQuantity;
    private Integer newQuantity;
    private Long workOrderId;
    private String workOrderTitle;
    private Long userId;
    private String userName;
    private String reason;
    private LocalDateTime createdAt;
}
