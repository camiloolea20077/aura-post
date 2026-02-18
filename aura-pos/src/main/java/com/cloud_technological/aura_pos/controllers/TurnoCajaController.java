package com.cloud_technological.aura_pos.controllers;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloud_technological.aura_pos.dto.caja.AbrirTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.CerrarTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaTableDto;
import com.cloud_technological.aura_pos.services.TurnoCajaService;
import com.cloud_technological.aura_pos.utils.ApiResponse;
import com.cloud_technological.aura_pos.utils.GlobalException;
import com.cloud_technological.aura_pos.utils.PageableDto;
import com.cloud_technological.aura_pos.utils.SecurityUtils;


@RestController
@RequestMapping("/api/turnos")
public class TurnoCajaController {
    @Autowired
    private TurnoCajaService turnoService;

    @Autowired
    private SecurityUtils securityUtils;

    @PostMapping("/page")
    public ResponseEntity<ApiResponse<PageImpl<TurnoCajaTableDto>>> listar(
            @RequestBody PageableDto<Object> pageable) {
        Integer empresaId = securityUtils.getEmpresaId();
        PageImpl<TurnoCajaTableDto> result = turnoService.listar(pageable, empresaId);
        if (result.isEmpty())
            throw new GlobalException(HttpStatus.PARTIAL_CONTENT, "No se encontraron registros");
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Listado exitoso", false, result), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TurnoCajaDto>> obtenerPorId(@PathVariable Long id) {
        Integer empresaId = securityUtils.getEmpresaId();
        TurnoCajaDto result = turnoService.obtenerPorId(id, empresaId);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Turno encontrado", false, result), HttpStatus.OK);
    }

    @GetMapping("/activo")
    public ResponseEntity<ApiResponse<TurnoCajaDto>> obtenerTurnoActivo() {
        Long usuarioId = securityUtils.getUsuarioId();
        TurnoCajaDto result = turnoService.obtenerTurnoActivo(usuarioId);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Turno activo", false, result), HttpStatus.OK);
    }

    @PostMapping("/abrir")
    public ResponseEntity<ApiResponse<TurnoCajaDto>> abrir(@Valid @RequestBody AbrirTurnoDto dto) {
        Integer empresaId = securityUtils.getEmpresaId();
        Long usuarioId = securityUtils.getUsuarioId();
        TurnoCajaDto result = turnoService.abrir(dto, empresaId, usuarioId);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.CREATED.value(), "Turno abierto exitosamente", false, result), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/cerrar")
    public ResponseEntity<ApiResponse<TurnoCajaDto>> cerrar(
            @PathVariable Long id,
            @Valid @RequestBody CerrarTurnoDto dto) {
        Integer empresaId = securityUtils.getEmpresaId();
        TurnoCajaDto result = turnoService.cerrar(id, dto, empresaId);
        return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Turno cerrado correctamente", false, result), HttpStatus.OK);
    }
}
