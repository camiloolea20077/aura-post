package com.cloud_technological.aura_pos.dto.terceros;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TerceroTableDto {
    private Long id;
    private String nombreCompleto; // Ya viene concatenado de la base de datos
    private String tipoDocumento;
    private String numeroDocumento;
    private String email;
    private String telefono;
    private String ciudad;
    
    // Para mostrar visualmente qué es (ej: "Cliente, Proveedor")
    private String rolesString; 
    
    private Boolean activo;
    @JsonIgnore
    private Long totalRows; // Para la paginación
}
