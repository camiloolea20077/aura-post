package com.cloud_technological.aura_pos.dto.terceros;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTerceroDto {
    private Long id;

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio")
    private String numeroDocumento;

    @NotBlank(message = "Los nombres son obligatorios")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    private String apellidos;

    @Email(message = "Formato de email inválido")
    private String email;

    private String telefono;
    private String direccion;
    private String ciudad;

    private Boolean esCliente;
    private Boolean esProveedor;
    private Boolean esEmpleado;
    
    private Boolean activo; // Permitimos activar/desactivar desde el editar
}
