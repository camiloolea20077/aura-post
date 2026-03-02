package com.cloud_technological.aura_pos.repositories.cuentas_cobrar;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloud_technological.aura_pos.entity.AbonoCobrarEntity;

public interface AbonoCobrarJPARepository extends JpaRepository<AbonoCobrarEntity, Long> {
    Optional<AbonoCobrarEntity> findByIdAndCuentaCobrarId(Long id, Long cuentaCobrarId);
    List<AbonoCobrarEntity> findByCuentaCobrarId(Long cuentaCobrarId);
}
