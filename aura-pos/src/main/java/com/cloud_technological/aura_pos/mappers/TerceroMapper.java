package com.cloud_technological.aura_pos.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mappings;

import com.cloud_technological.aura_pos.dto.terceros.CreateTerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.UpdateTerceroDto;
import com.cloud_technological.aura_pos.entity.TerceroEntity;

@Mapper(componentModel = "spring")
public interface TerceroMapper {
// 1. Entity -> Detalle Completo (Para findById)
    @Mapping(target = "nombreCompleto", expression = "java(entity.getNombres() + \" \" + entity.getApellidos())")
    TerceroDto toDto(TerceroEntity entity);

    // 2. CreateDto -> Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activo", constant = "true")
    @Mapping(target = "empresa", ignore = true)
    // ... otros ignores ...
    TerceroEntity toEntity(CreateTerceroDto dto);

    // 3. UpdateDto -> Entity (Actualizar existente)
    @Mapping(target = "id", ignore = true) // El ID no se toca en la entidad
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "created_at", ignore = true)
    @Mapping(target = "updated_at", ignore = true)
    @Mapping(target = "deleted_at", ignore = true)
    void updateEntityFromDto(UpdateTerceroDto dto, @MappingTarget TerceroEntity entity);
}
