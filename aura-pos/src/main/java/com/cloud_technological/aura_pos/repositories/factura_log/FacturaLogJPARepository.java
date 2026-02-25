package com.cloud_technological.aura_pos.repositories.factura_log;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cloud_technological.aura_pos.entity.FacturaLogEntity;

@Repository
public interface FacturaLogJPARepository extends JpaRepository<FacturaLogEntity, Long> {
    
    List<FacturaLogEntity> findByFacturaIdOrderByCreatedAtDesc(Long facturaId);
}
