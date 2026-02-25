package com.cloud_technological.aura_pos.services.implementations;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.cloud_technological.aura_pos.entity.FacturaEntity;
import com.cloud_technological.aura_pos.entity.FacturaLogEntity;
import com.cloud_technological.aura_pos.repositories.factura_log.FacturaLogJPARepository;
import com.cloud_technological.aura_pos.repositories.facturacion.FacturaJPARepository;
import com.cloud_technological.aura_pos.services.FacturaLogService;

@Service
public class FacturaLogServiceImpl implements FacturaLogService {

    private static final Logger logger = LoggerFactory.getLogger(FacturaLogServiceImpl.class);
    
    private final FacturaLogJPARepository facturaLogRepository;
    private final FacturaJPARepository facturaRepository;

    @Autowired
    public FacturaLogServiceImpl(FacturaLogJPARepository facturaLogRepository,
            FacturaJPARepository facturaRepository) {
        this.facturaLogRepository = facturaLogRepository;
        this.facturaRepository = facturaRepository;
    }

    @Override
    @Async("facturaLogExecutor")
    public void registrarLogAsync(Long facturaId, String evento, String estadoAnterior, 
            String estadoNuevo, Object datos, Integer usuarioId, String mensaje, Object metadata) {
        try {
            FacturaEntity factura = facturaRepository.findById(facturaId).orElse(null);
            if (factura == null) {
                logger.warn("Factura no encontrada para log: {}", facturaId);
                return;
            }

            FacturaLogEntity log = new FacturaLogEntity();
            log.setFactura(factura);
            log.setEvento(evento);
            log.setEstadoAnterior(estadoAnterior);
            log.setEstadoNuevo(estadoNuevo);
            log.setDatos(datos);
            log.setUsuarioId(usuarioId);
            log.setMensaje(mensaje);
            log.setMetadata(metadata);
            log.setCreatedAt(LocalDateTime.now());

            facturaLogRepository.save(log);
            logger.debug("Log de factura registrado: {} - {}", facturaId, evento);
            
        } catch (Exception e) {
            // Silencioso - nunca debe fallar el proceso principal
            logger.error("Error al registrar log de factura: {} - {}", facturaId, e.getMessage());
        }
    }

    @Override
    public List<FacturaLogEntity> obtenerPorFactura(Long facturaId) {
        return facturaLogRepository.findByFacturaIdOrderByCreatedAtDesc(facturaId);
    }
}
