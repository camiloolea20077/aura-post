package com.cloud_technological.aura_pos.repositories.terceros;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.cloud_technological.aura_pos.dto.terceros.TerceroDto;
import com.cloud_technological.aura_pos.dto.terceros.TerceroTableDto;
import com.cloud_technological.aura_pos.utils.PageableDto;

@Repository
public class TerceroQueryRepository {
   @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    public boolean existsByNumeroDocumentoAndEmpresaId(String numeroDocumento, Integer empresaId) {
        String sql = """
            SELECT COUNT(*) > 0 
            FROM terceros 
            WHERE numero_documento = :numeroDocumento 
              AND empresa_id = :empresaId 
              AND deleted_at IS NULL
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("numeroDocumento", numeroDocumento)
            .addValue("empresaId", empresaId);
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, params, Boolean.class));
    }

    public boolean existsByNumeroDocumentoAndEmpresaIdAndIdNot(String numeroDocumento, Integer empresaId, Long id) {
        String sql = """
            SELECT COUNT(*) > 0 
            FROM terceros 
            WHERE numero_documento = :numeroDocumento 
              AND empresa_id = :empresaId 
              AND id != :id
              AND deleted_at IS NULL
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("numeroDocumento", numeroDocumento)
            .addValue("empresaId", empresaId)
            .addValue("id", id);
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, params, Boolean.class));
    }

    public PageImpl<TerceroTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        
        int page = pageable.getPage() != null ? pageable.getPage().intValue() : 0;
        int size = pageable.getRows() != null ? pageable.getRows().intValue() : 10;
        String search = pageable.getSearch() != null ? pageable.getSearch().trim().toLowerCase() : "";

        StringBuilder sql = new StringBuilder("""
            SELECT 
                t.id,
                t.nombres, t.apellidos,
                CONCAT(t.nombres, ' ', t.apellidos) as nombre_completo,
                t.tipo_documento,
                t.numero_documento,
                t.email,
                t.telefono,
                t.ciudad,
                t.es_cliente,
                t.es_proveedor,
                t.es_empleado,
                t.activo,
                COUNT(*) OVER() AS total_rows 
            FROM terceros t 
            WHERE t.empresa_id = :empresaId 
            AND t.deleted_at IS NULL 
        """);

        MapSqlParameterSource params = new MapSqlParameterSource("empresaId", empresaId);

        if (!search.isEmpty()) {
            sql.append(" AND (LOWER(t.nombres) LIKE :search OR LOWER(t.apellidos) LIKE :search OR t.numero_documento LIKE :search) ");
            params.addValue("search", "%" + search + "%");
        }

        sql.append(" ORDER BY t.id DESC OFFSET :offset LIMIT :limit ");
        params.addValue("offset", page * size);
        params.addValue("limit", size);

        List<TerceroTableDto> list = jdbcTemplate.query(sql.toString(), params, new BeanPropertyRowMapper<>(TerceroTableDto.class));

        long total = list.isEmpty() ? 0 : list.get(0).getTotalRows(); // Asegúrate de agregar `private Long totalRows;` en TerceroDto (ignorado en JSON response si quieres)

        return new PageImpl<>(list, PageRequest.of(page, size), total);
    }
}
