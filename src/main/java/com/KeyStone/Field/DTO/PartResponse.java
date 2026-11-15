package com.KeyStone.Field.DTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartResponse {

    private Long id;

    private String name;

    private String partNumber;

    private String description;

    private Integer quantity;

    private BigDecimal price;

    private Boolean active;

    private Integer lowStockThreshold;

    private Boolean isLowStock;

    private LocalDateTime createdAt;
}
