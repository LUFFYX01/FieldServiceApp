package com.KeyStone.Field.DTO;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignTechnicianRequest {

    @NotNull
    private Long technicianId;
}