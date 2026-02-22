package com.cloud_technological.aura_pos.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.cloud_technological.aura_pos.entity.SucursalEntity;

@Mapper(componentModel = "spring")
public interface SucursalMapper {

    @Mapping(target = "empresa", ignore = true)
    SucursalEntity toEntity(CreateSucursalDto dto);

    SucursalDto toDto(SucursalEntity entity);

    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "id", ignore = true)
    void updateEntity(UpdateSucursalDto dto, @MappingTarget SucursalEntity entity);
}
