package com.cloud_technological.aura_pos.dto.caja;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovimientoCajaDto {
    private Long       id;
    private String     tipo;          // INGRESO | EGRESO
    private String     concepto;
    private BigDecimal monto;
    private String     fecha;
    private String     usuarioNombre;
}
