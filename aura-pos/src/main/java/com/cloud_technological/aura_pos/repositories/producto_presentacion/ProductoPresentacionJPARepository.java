package com.cloud_technological.aura_pos.repositories.producto_presentacion;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloud_technological.aura_pos.entity.ProductoPresentacionEntity;

public interface ProductoPresentacionJPARepository extends JpaRepository<ProductoPresentacionEntity, Long> {
    Optional<ProductoPresentacionEntity> findByIdAndProductoEmpresaId(Long id, Integer empresaId);
    List<ProductoPresentacionEntity> findByProductoIdAndActivoTrue(Long productoId);
}