package com.KeyStone.Field.DTO;

import lombok.*;

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
}