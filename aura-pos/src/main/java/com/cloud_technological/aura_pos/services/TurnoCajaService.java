package com.cloud_technological.aura_pos.services;

import org.springframework.data.domain.PageImpl;

import com.cloud_technological.aura_pos.dto.caja.AbrirTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.CerrarTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaTableDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

public interface TurnoCajaService {
    PageImpl<TurnoCajaTableDto> listar(PageableDto<Object> pageable, Integer empresaId);
    TurnoCajaDto obtenerPorId(Long id, Integer empresaId);
    TurnoCajaDto obtenerTurnoActivo(Long usuarioId);
    TurnoCajaDto abrir(AbrirTurnoDto dto, Integer empresaId, Long usuarioId);
    TurnoCajaDto cerrar(Long id, CerrarTurnoDto dto, Integer empresaId);
}
