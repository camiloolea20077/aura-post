package com.cloud_technological.aura_pos.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import com.cloud_technological.aura_pos.dto.facturacion.NotaContableDto;
import com.cloud_technological.aura_pos.entity.NotaContableEntity;

@Mapper(componentModel = "spring")
public interface NotaContableMapper {
    
    @Mappings({
        @Mapping(target = "facturaId", source = "entity.factura.id"),
        @Mapping(target = "usuarioId", source = "entity.usuario.id"),
    })
    NotaContableDto toDto(NotaContableEntity entity);
    
    @Mappings({
        @Mapping(target = "id", ignore = true),
        @Mapping(target = "factura", ignore = true),
        @Mapping(target = "usuario", ignore = true),
        @Mapping(target = "createdAt", ignore = true),
    })
    NotaContableEntity toEntity(NotaContableDto dto);
}
