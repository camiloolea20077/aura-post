package com.cloud_technological.aura_pos.controllers;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloud_technological.aura_pos.dto.terceros.CreateTerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroTableDto;
import com.cloud_technological.aura_pos.dto.terceros.UpdateTerceroDto;
import com.cloud_technological.aura_pos.services.ITerceroService;
import com.cloud_technological.aura_pos.utils.ApiResponse;
import com.cloud_technological.aura_pos.utils.PageableDto;
import com.cloud_technological.aura_pos.utils.SecurityUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/terceros")
@RequiredArgsConstructor
public class TerceroController {
        @Autowired
        private ITerceroService terceroService;

        @Autowired
        private SecurityUtils securityUtils; // Inyectamos la utility

        @PostMapping("/list")
        public ResponseEntity<ApiResponse<PageImpl<TerceroTableDto>>> listar(
                        @RequestBody PageableDto<Object> pageable) {
                Integer empresaId = securityUtils.getEmpresaId();
                PageImpl<TerceroTableDto> result = terceroService.listar(pageable, empresaId);
                return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Listado exitoso", false, result),
                                HttpStatus.OK);
        }

        @PostMapping
        public ResponseEntity<ApiResponse<TerceroDto>> crear(@Valid @RequestBody CreateTerceroDto dto) {
                Integer empresaId = securityUtils.getEmpresaId();

                TerceroDto result = terceroService.crear(dto, empresaId);

                return new ResponseEntity<>(new ApiResponse<>(HttpStatus.CREATED.value(), "Tercero creado exitosamente",
                                false, result), HttpStatus.CREATED);
        }

        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<Boolean>> actualizar(@PathVariable Long id, @Valid @RequestBody UpdateTerceroDto dto) {
                Integer empresaId = securityUtils.getEmpresaId();
                
                // Aseguramos consistencia
                dto.setId(id);
                
                boolean result = terceroService.actualizar(dto, empresaId);
                return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Tercero actualizado", false, result), HttpStatus.OK);
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Boolean>> eliminar(@PathVariable Long id) {
                Integer empresaId = securityUtils.getEmpresaId();

                boolean result = terceroService.eliminar(id, empresaId);

                return new ResponseEntity<>(
                                new ApiResponse<>(HttpStatus.OK.value(), "Tercero eliminado", false, result),
                                HttpStatus.OK);
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<TerceroDto>> obtener(@PathVariable Long id) {
                Integer empresaId = securityUtils.getEmpresaId();

                TerceroDto result = terceroService.obtenerPorId(id, empresaId);

                return new ResponseEntity<>(new ApiResponse<>(HttpStatus.OK.value(), "Detalle obtenido", false, result),
                                HttpStatus.OK);
        }
}
