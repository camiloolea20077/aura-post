package com.cloud_technological.aura_pos.dto.terceros;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TerceroDto {
    private Long id;
    private String nombreCompleto; // Concatenación Nombres + Apellidos
    private String tipoDocumento;
    private String numeroDocumento;
    private String email;
    private String telefono;
    private String ciudad;
    
    private Boolean esCliente;
    private Boolean esProveedor;
    private Boolean esEmpleado;
    
    private Boolean activo;

    // Este campo lo usa el QueryRepository para saber el total de páginas
    // @JsonIgnore hace que NO se envíe al frontend en cada fila, ahorrando peso
    @JsonIgnore 
    private Long totalRows;
}
