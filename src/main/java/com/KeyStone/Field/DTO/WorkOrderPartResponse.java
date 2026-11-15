package com.KeyStone.Field.DTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderPartResponse {

    private Long id;

    private Long partId;
    private String partName;
    private String partNumber;

    private Integer requiredQuantity;
    private Integer usedQuantity;

    private BigDecimal unitPrice;
    private Integer availableStock;
    private BigDecimal lineTotal;
}
