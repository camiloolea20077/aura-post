package com.cloud_technological.aura_pos.repositories.movimiento_caja;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloud_technological.aura_pos.entity.MovimientoCajaEntity;

public interface MovimientoCajaJPARepository extends JpaRepository<MovimientoCajaEntity, Long> {

    List<MovimientoCajaEntity> findByTurnoCajaIdOrderByFechaAsc(Long turnoCajaId);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCajaEntity m " +
           "WHERE m.turnoCaja.id = :turnoId AND m.tipo = :tipo")
    BigDecimal sumMontoByTurnoIdAndTipo(@Param("turnoId") Long turnoId, @Param("tipo") String tipo);
}
