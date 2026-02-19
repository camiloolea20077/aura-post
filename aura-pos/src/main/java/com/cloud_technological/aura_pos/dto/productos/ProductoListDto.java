package com.cloud_technological.aura_pos.dto.productos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoListDto {
    private Long id;
    private String sku;
    private String nombre;
}
