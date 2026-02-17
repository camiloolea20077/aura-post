package com.cloud_technological.aura_pos.repositories.productos;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.cloud_technological.aura_pos.dto.productos.ProductoTableDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

@Repository
public class ProductoQueryRepository {

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    public PageImpl<ProductoTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        int page = pageable.getPage() != null ? pageable.getPage().intValue() : 0;
        int size = pageable.getRows() != null ? pageable.getRows().intValue() : 10;
        String search = pageable.getSearch() != null ? pageable.getSearch().trim().toLowerCase() : "";

        StringBuilder sql = new StringBuilder("""
            SELECT
                p.id,
                p.sku,
                p.nombre,
                p.codigo_barras,
                c.nombre AS categoria_nombre,
                m.nombre AS marca_nombre,
                p.tipo_producto,
                p.precio,
                p.costo,
                p.activo,
                COUNT(*) OVER() AS total_rows
            FROM producto p
            LEFT JOIN categoria c ON p.categoria_id = c.id
            LEFT JOIN marca m ON p.marca_id = m.id
            WHERE p.empresa_id = :empresaId
            AND p.deleted_at IS NULL
        """);

        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);

        if (!search.isEmpty()) {
            sql.append("""
                AND (LOWER(p.nombre) LIKE :search
                OR LOWER(p.sku) LIKE :search
                OR LOWER(p.codigo_barras) LIKE :search
                OR LOWER(c.nombre) LIKE :search
                OR LOWER(m.nombre) LIKE :search)
            """);
            params.addValue("search", "%" + search + "%");
        }

        sql.append(" ORDER BY p.id DESC OFFSET :offset LIMIT :limit ");
        params.addValue("offset", page * size);
        params.addValue("limit", size);

        List<ProductoTableDto> list = jdbcTemplate.query(sql.toString(), params,
                new BeanPropertyRowMapper<>(ProductoTableDto.class));

        long total = list.isEmpty() ? 0 : list.get(0).getTotalRows();
        return new PageImpl<>(list, PageRequest.of(page, size), total);
    }

    public boolean existeCodigoBarras(String codigoBarras, Integer empresaId) {
        String sql = """
            SELECT COUNT(*) FROM producto
            WHERE codigo_barras = :codigoBarras
            AND empresa_id = :empresaId
            AND deleted_at IS NULL
        """;
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("codigoBarras", codigoBarras);
        params.addValue("empresaId", empresaId);
        Long count = jdbcTemplate.queryForObject(sql, params, Long.class);
        return count != null && count > 0;
    }

    public boolean existeCodigoBarrasExcluyendo(String codigoBarras, Integer empresaId, Long id) {
        String sql = """
            SELECT COUNT(*) FROM producto
            WHERE codigo_barras = :codigoBarras
            AND empresa_id = :empresaId
            AND id != :id
            AND deleted_at IS NULL
        """;
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("codigoBarras", codigoBarras);
        params.addValue("empresaId", empresaId);
        params.addValue("id", id);
        Long count = jdbcTemplate.queryForObject(sql, params, Long.class);
        return count != null && count > 0;
    }
}