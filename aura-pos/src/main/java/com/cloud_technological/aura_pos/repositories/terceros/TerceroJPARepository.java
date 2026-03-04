package com.cloud_technological.aura_pos.repositories.terceros;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloud_technological.aura_pos.entity.TerceroEntity;

public interface TerceroJPARepository extends JpaRepository<TerceroEntity, Integer> {
    // Buscar uno asegurando que sea de la empresa (Seguridad)
    Optional<TerceroEntity> findByIdAndEmpresaId(Long id, Integer empresaId);

}