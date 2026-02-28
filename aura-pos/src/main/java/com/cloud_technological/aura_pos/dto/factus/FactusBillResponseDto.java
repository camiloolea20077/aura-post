package com.cloud_technological.aura_pos.dto.factus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FactusBillResponseDto {
    private boolean status;
    private String message;
    private FactusBillDataDto data;
}
