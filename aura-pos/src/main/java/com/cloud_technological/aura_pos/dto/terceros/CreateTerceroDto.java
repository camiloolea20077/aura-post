package com.cloud_technological.aura_pos.dto.terceros;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTerceroDto {
    // Opcional: Para updates, aunque suele ir en la URL
    private Long id; 

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento; // CC, NIT, CE, TI

    @NotBlank(message = "El número de documento es obligatorio")
    private String numeroDocumento;

    @NotBlank(message = "Los nombres son obligatorios")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    private String apellidos;

    @Email(message = "El formato del correo es inválido")
    private String email;

    private String telefono;
    private String direccion;
    private String ciudad;

    // Flags para definir roles (pueden ser true los 3 a la vez)
    private Boolean esCliente;
    private Boolean esProveedor;
    private Boolean esEmpleado;
}
