package com.cloud_technological.aura_pos.dto.auth;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDto {
    // --- Datos de la Empresa ---
    @NotBlank(message = "El NIT es obligatorio")
    private String nit;

    @NotBlank(message = "La razón social es obligatoria")
    private String razonSocial;

    // --- Datos de la Sucursal Principal ---
    @NotBlank(message = "El nombre de la sucursal es obligatorio")
    private String nombreSucursal; // Ej: "Casa Matriz"

    // --- Datos del Usuario Admin ---
    @NotBlank(message = "El documento es obligatorio")
    private String numeroDocumento;

    @NotBlank(message = "Los nombres son obligatorios")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    private String apellidos;

    @Email(message = "Email inválido")
    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
