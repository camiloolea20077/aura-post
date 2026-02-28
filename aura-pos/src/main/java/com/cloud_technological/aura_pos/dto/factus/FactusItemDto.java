package com.cloud_technological.aura_pos.dto.factus;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class FactusItemDto {
    @JsonProperty("code_reference")
    private String codeReference;          // SKU del producto

    private String description;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("discount_rate")
    private BigDecimal discountRate;       // % descuento (0 si no hay)

    @JsonProperty("price")
    private BigDecimal price;             // precio SIN IVA

    @JsonProperty("tax_rate")
    private String taxRate;              // "19.00", "5.00", "0.00"

    @JsonProperty("unit_measure_id")
    private Integer unitMeasureId;        // 70 = unidad, 94 = kilo, etc.

    @JsonProperty("standard_code_id")
    private Integer standardCodeId;      // 1 = código estándar DIAN

    @JsonProperty("is_excluded")
    private Integer isExcluded;          // 0=gravado, 1=excluido
}
