package com.cloud_technological.aura_pos.services;

import org.springframework.data.domain.PageImpl;

import com.cloud_technological.aura_pos.dto.productos.CreateProductoDto;
import com.cloud_technological.aura_pos.dto.productos.ProductoDto;
import com.cloud_technological.aura_pos.dto.productos.ProductoTableDto;
import com.cloud_technological.aura_pos.dto.productos.UpdateProductoDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

public interface ProductoService {
    PageImpl<ProductoTableDto> listar(PageableDto<Object> pageable, Integer empresaId);
    ProductoDto obtenerPorId(Long id, Integer empresaId);
    ProductoDto crear(CreateProductoDto dto, Integer empresaId);
    ProductoDto actualizar(Long id, UpdateProductoDto dto, Integer empresaId);
    void eliminar(Long id, Integer empresaId);
}
