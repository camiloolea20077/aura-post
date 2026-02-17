package com.cloud_technological.aura_pos.repositories.users;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloud_technological.aura_pos.entity.UsuarioEntity;

public interface UsuarioJPARepository extends JpaRepository<UsuarioEntity, Integer>{
    // Usamos JOIN FETCH para optimizar la carga del Rol y el Tercero al validar login
    @Query("SELECT u FROM UsuarioEntity u JOIN FETCH u.tercero WHERE u.username = :username")
    Optional<UsuarioEntity> findByUsername(@Param("username") String username);
}
