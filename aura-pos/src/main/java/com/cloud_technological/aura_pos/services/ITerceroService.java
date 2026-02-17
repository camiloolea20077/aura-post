package com.cloud_technological.aura_pos.services;

import org.springframework.data.domain.PageImpl;

import com.cloud_technological.aura_pos.dto.terceros.CreateTerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroTableDto;
import com.cloud_technological.aura_pos.dto.terceros.UpdateTerceroDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

public interface ITerceroService {
    PageImpl<TerceroTableDto> listar(PageableDto<Object> pageable, Integer empresaId);
    TerceroDto crear(CreateTerceroDto dto, Integer empresaId);
    boolean actualizar(UpdateTerceroDto dto, Integer empresaId);
    boolean eliminar(Long id, Integer empresaId);
    TerceroDto obtenerPorId(Long id, Integer empresaId);
}
