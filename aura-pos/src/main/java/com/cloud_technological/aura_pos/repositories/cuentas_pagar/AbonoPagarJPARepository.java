package com.cloud_technological.aura_pos.repositories.cuentas_pagar;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloud_technological.aura_pos.entity.AbonoPagarEntity;

public interface AbonoPagarJPARepository extends JpaRepository<AbonoPagarEntity, Long> {
    Optional<AbonoPagarEntity> findByIdAndCuentaPagarId(Long id, Long cuentaPagarId);
}
