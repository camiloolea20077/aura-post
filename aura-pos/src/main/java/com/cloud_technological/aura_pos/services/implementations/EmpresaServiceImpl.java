package com.cloud_technological.aura_pos.services.implementations;

import org.springframework.stereotype.Service;

import com.cloud_technological.aura_pos.dto.empresas.EmpresaDto;
import com.cloud_technological.aura_pos.entity.EmpresaEntity;
import com.cloud_technological.aura_pos.entity.SucursalEntity;
import com.cloud_technological.aura_pos.repositories.empresas.EmpresaJPARepository;
import com.cloud_technological.aura_pos.repositories.sucursales.SucursalJPARepository;
import com.cloud_technological.aura_pos.repositories.users.UsuarioJPARepository;
import com.cloud_technological.aura_pos.services.IEmpresaService;
import com.cloud_technological.aura_pos.utils.GlobalException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class EmpresaServiceImpl implements IEmpresaService {

    private final EmpresaJPARepository empresaRepository;
    private final SucursalJPARepository sucursalRepository;
    private final UsuarioJPARepository usuarioRepository;

    @Override
    public EmpresaDto obtenerEmpresaActual(Integer empresaId, Long sucursalId, Long usuarioId) {
        EmpresaEntity empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        SucursalEntity sucursal = null;
        if (sucursalId != null) {
            sucursal = sucursalRepository.findByIdAndEmpresaId(sucursalId.intValue(), empresaId)
                    .orElse(null);
        }

        String telefono = "";
        String direccion = "";
        String ciudad = "";
        String correo = "";

        if (usuarioId != null) {
            var usuario = usuarioRepository.findById(usuarioId.intValue()).orElse(null);
            if (usuario != null && usuario.getTercero() != null) {
                var tercero = usuario.getTercero();
                correo = tercero.getEmail() != null ? tercero.getEmail() : "";
                telefono = tercero.getTelefono() != null ? tercero.getTelefono() : "";
                direccion = tercero.getDireccion() != null ? tercero.getDireccion() : "";
            }
        }

        return EmpresaDto.builder()
                .id(empresa.getId())
                .razonSocial(empresa.getRazonSocial())
                .nombreComercial(empresa.getNombreComercial())
                .nit(empresa.getNit())
                .dv(empresa.getDv())
                .logoUrl(empresa.getLogoUrl())
                .telefono(telefono)
                .correo(correo)
                .direccion(direccion)
                .ciudad(ciudad)
                .facturaElectronica(empresa.isFacturaElectronica())
                .sucursalId(sucursal != null ? sucursal.getId() : null)
                .sucursalNombre(sucursal != null ? sucursal.getNombre() : null)
                .sucursalDireccion(sucursal != null ? sucursal.getDireccion() : null)
                .sucursalTelefono(sucursal != null ? sucursal.getTelefono() : null)
                .sucursalCiudad(sucursal != null ? sucursal.getCiudad() : null)
                .sucursalPrefijoFacturacion(sucursal != null ? sucursal.getPrefijoFacturacion() : null)
                .build();
    }
}
