package com.cloud_technological.aura_pos.repositories.cuentas_cobrar;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.cloud_technological.aura_pos.dto.cuentas_cobrar.CuentaCobrarResumenDto;
import com.cloud_technological.aura_pos.dto.cuentas_cobrar.CuentaCobrarTableDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

@Repository
public class CuentaCobrarQueryRepository {
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    public PageImpl<CuentaCobrarTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        int page = pageable.getPage() != null ? pageable.getPage().intValue() : 0;
        int size = pageable.getRows() != null ? pageable.getRows().intValue() : 10;
        String search = pageable.getSearch() != null ? pageable.getSearch().trim().toLowerCase() : "";

        StringBuilder sql = new StringBuilder("""
            SELECT
                cc.id,
                cc.numero_cuenta,
                COALESCE(NULLIF(t.razon_social, ''), CONCAT(t.nombres, ' ', t.apellidos), 'Consumidor Final') AS cliente_nombre,
                t.numero_documento AS cliente_documento,
                cc.fecha_emision,
                cc.fecha_vencimiento,
                cc.total_deuda,
                cc.total_abonado,
                cc.saldo_pendiente,
                cc.estado,
                COUNT(*) OVER() AS total_rows
            FROM cuentas_cobrar cc
            INNER JOIN tercero t ON cc.tercero_id = t.id
            WHERE cc.empresa_id = :empresaId
            AND cc.deleted_at IS NULL
        """);

        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);

        if (!search.isEmpty()) {
            sql.append("""
                AND (LOWER(cc.numero_cuenta) LIKE :search
                OR LOWER(t.razon_social) LIKE :search
                OR LOWER(t.nombres) LIKE :search
                OR LOWER(t.apellidos) LIKE :search
                OR t.numero_documento LIKE :search
                OR LOWER(cc.estado) LIKE :search)
            """);
            params.addValue("search", "%" + search + "%");
        }

        sql.append(" ORDER BY cc.id DESC OFFSET :offset LIMIT :limit ");
        params.addValue("offset", page * size);
        params.addValue("limit", size);

        List<CuentaCobrarTableDto> list = jdbcTemplate.query(sql.toString(), params,
                new BeanPropertyRowMapper<>(CuentaCobrarTableDto.class));

        long total = list.isEmpty() ? 0 : list.get(0).getTotalRows();
        return new PageImpl<>(list, PageRequest.of(page, size), total);
    }

    public PageImpl<CuentaCobrarTableDto> listarConFiltros(PageableDto<Object> pageable, Integer empresaId,
            String fechaDesde, String fechaHasta, Long clienteId, String estado) {
        int page = pageable.getPage() != null ? pageable.getPage().intValue() : 0;
        int size = pageable.getRows() != null ? pageable.getRows().intValue() : 10;
        String search = pageable.getSearch() != null ? pageable.getSearch().trim().toLowerCase() : "";

        StringBuilder sql = new StringBuilder("""
            SELECT
                cc.id,
                cc.numero_cuenta,
                COALESCE(NULLIF(t.razon_social, ''), CONCAT(t.nombres, ' ', t.apellidos), 'Consumidor Final') AS cliente_nombre,
                t.numero_documento AS cliente_documento,
                cc.fecha_emision,
                cc.fecha_vencimiento,
                cc.total_deuda,
                cc.total_abonado,
                cc.saldo_pendiente,
                cc.estado,
                COUNT(*) OVER() AS total_rows
            FROM cuentas_cobrar cc
            INNER JOIN tercero t ON cc.tercero_id = t.id
            WHERE cc.empresa_id = :empresaId
            AND cc.deleted_at IS NULL
        """);

        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);

        if (search != null && !search.isEmpty()) {
            sql.append("""
                AND (LOWER(cc.numero_cuenta) LIKE :search
                OR LOWER(t.razon_social) LIKE :search
                OR LOWER(t.nombres) LIKE :search
                OR LOWER(t.apellidos) LIKE :search
                OR t.numero_documento LIKE :search
                OR LOWER(cc.estado) LIKE :search)
            """);
            params.addValue("search", "%" + search + "%");
        }

        if (fechaDesde != null && !fechaDesde.isEmpty()) {
            sql.append(" AND cc.fecha_emision >= :fechaDesde");
            params.addValue("fechaDesde", fechaDesde);
        }

        if (fechaHasta != null && !fechaHasta.isEmpty()) {
            sql.append(" AND cc.fecha_emision <= :fechaHasta");
            params.addValue("fechaHasta", fechaHasta);
        }

        if (clienteId != null) {
            sql.append(" AND cc.tercero_id = :clienteId");
            params.addValue("clienteId", clienteId);
        }

        if (estado != null && !estado.isEmpty()) {
            sql.append(" AND cc.estado = :estado");
            params.addValue("estado", estado);
        }

        sql.append(" ORDER BY cc.id DESC OFFSET :offset LIMIT :limit ");
        params.addValue("offset", page * size);
        params.addValue("limit", size);

        List<CuentaCobrarTableDto> list = jdbcTemplate.query(sql.toString(), params,
                new BeanPropertyRowMapper<>(CuentaCobrarTableDto.class));

        long total = list.isEmpty() ? 0 : list.get(0).getTotalRows();
        return new PageImpl<>(list, PageRequest.of(page, size), total);
    }

    public String generarNumeroCuenta() {
        String sql = """
            SELECT 'CC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                   LPAD(COALESCE(MAX(SUBSTRING(numero_cuenta FROM 10 FOR 4)), '0')::INT + 1, 4, '0')
            FROM cuentas_cobrar
            WHERE numero_cuenta LIKE 'CC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%'
        """;
        return jdbcTemplate.queryForObject(sql, new MapSqlParameterSource(), String.class);
    }

    public CuentaCobrarResumenDto obtenerResumen(Integer empresaId, String fechaDesde, String fechaHasta, Long clienteId, String estado) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                COUNT(*) AS total_cuentas,
                COALESCE(SUM(total_deuda), 0) AS total_deuda,
                COALESCE(SUM(total_abonado), 0) AS total_abonado,
                COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente,
                COUNT(*) FILTER (WHERE estado = 'activa') AS cantidad_activas,
                COUNT(*) FILTER (WHERE estado = 'pagada') AS cantidad_pagadas,
                COUNT(*) FILTER (WHERE estado = 'vencida') AS cantidad_vencidas
            FROM cuentas_cobrar
            WHERE empresa_id = :empresaId
            AND deleted_at IS NULL
        """);

        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);

        if (fechaDesde != null && !fechaDesde.isEmpty()) {
            sql.append(" AND fecha_emision >= :fechaDesde");
            params.addValue("fechaDesde", fechaDesde);
        }

        if (fechaHasta != null && !fechaHasta.isEmpty()) {
            sql.append(" AND fecha_emision <= :fechaHasta");
            params.addValue("fechaHasta", fechaHasta);
        }

        if (clienteId != null) {
            sql.append(" AND tercero_id = :clienteId");
            params.addValue("clienteId", clienteId);
        }

        if (estado != null && !estado.isEmpty()) {
            sql.append(" AND estado = :estado");
            params.addValue("estado", estado);
        }

        return jdbcTemplate.queryForObject(sql.toString(), params, (rs, rowNum) -> {
            CuentaCobrarResumenDto dto = new CuentaCobrarResumenDto();
            dto.setTotalCuentas(rs.getLong("total_cuentas"));
            dto.setTotalDeuda(rs.getBigDecimal("total_deuda"));
            dto.setTotalAbonado(rs.getBigDecimal("total_abonado"));
            dto.setSaldoPendiente(rs.getBigDecimal("saldo_pendiente"));
            dto.setCantidadActivas(rs.getLong("cantidad_activas"));
            dto.setCantidadPagadas(rs.getLong("cantidad_pagadas"));
            dto.setCantidadVencidas(rs.getLong("cantidad_vencidas"));
            return dto;
        });
    }

    public List<CuentaCobrarTableDto> obtenerVencidas(Integer empresaId) {
        String sql = """
            SELECT
                cc.id,
                cc.numero_cuenta,
                COALESCE(NULLIF(t.razon_social, ''), CONCAT(t.nombres, ' ', t.apellidos), 'Consumidor Final') AS cliente_nombre,
                t.numero_documento AS cliente_documento,
                cc.fecha_emision,
                cc.fecha_vencimiento,
                cc.total_deuda,
                cc.total_abonado,
                cc.saldo_pendiente,
                cc.estado,
                1 AS total_rows
            FROM cuentas_cobrar cc
            INNER JOIN tercero t ON cc.tercero_id = t.id
            WHERE cc.empresa_id = :empresaId
            AND cc.deleted_at IS NULL
            AND cc.fecha_vencimiento < NOW()
            AND cc.estado = 'activa'
            ORDER BY cc.fecha_vencimiento ASC
        """;
        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);
        return jdbcTemplate.query(sql, params, new BeanPropertyRowMapper<>(CuentaCobrarTableDto.class));
    }
}
