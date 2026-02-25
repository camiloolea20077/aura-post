package com.cloud_technological.aura_pos.services;

import java.util.List;

import com.cloud_technological.aura_pos.entity.FacturaLogEntity;

public interface FacturaLogService {
    
    void registrarLogAsync(Long facturaId, String evento, String estadoAnterior, 
            String estadoNuevo, Object datos, Integer usuarioId, String mensaje, Object metadata);
    
    List<FacturaLogEntity> obtenerPorFactura(Long facturaId);
}
