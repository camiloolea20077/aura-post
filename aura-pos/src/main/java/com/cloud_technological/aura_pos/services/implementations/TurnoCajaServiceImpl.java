package com.cloud_technological.aura_pos.services.implementations;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloud_technological.aura_pos.dto.caja.AbrirTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.CerrarTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.ResumenTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaTableDto;
import com.cloud_technological.aura_pos.entity.CajaEntity;
import com.cloud_technological.aura_pos.entity.TurnoCajaEntity;
import com.cloud_technological.aura_pos.entity.UsuarioEntity;
import com.cloud_technological.aura_pos.mappers.TurnoCajaMapper;
import com.cloud_technological.aura_pos.repositories.caja.CajaJPARepository;
import com.cloud_technological.aura_pos.repositories.turno_caja.TurnoCajaJPARepository;
import com.cloud_technological.aura_pos.repositories.turno_caja.TurnoCajaQueryRepository;
import com.cloud_technological.aura_pos.repositories.users.UsuarioJPARepository;
import com.cloud_technological.aura_pos.services.TurnoCajaService;
import com.cloud_technological.aura_pos.utils.GlobalException;
import com.cloud_technological.aura_pos.utils.PageableDto;

import jakarta.transaction.Transactional;

@Service
public class TurnoCajaServiceImpl implements TurnoCajaService{
    
    private final TurnoCajaQueryRepository turnoRepository;
    private final TurnoCajaJPARepository turnoJPARepository;
    private final CajaJPARepository cajaJPARepository;
    private final UsuarioJPARepository usuarioJPARepository;
    private final TurnoCajaMapper turnoMapper;

    @Autowired
    public TurnoCajaServiceImpl(TurnoCajaQueryRepository turnoRepository,
            TurnoCajaJPARepository turnoJPARepository,
            CajaJPARepository cajaJPARepository,
            UsuarioJPARepository usuarioJPARepository,
            TurnoCajaMapper turnoMapper) {
        this.turnoRepository = turnoRepository;
        this.turnoJPARepository = turnoJPARepository;
        this.cajaJPARepository = cajaJPARepository;
        this.usuarioJPARepository = usuarioJPARepository;
        this.turnoMapper = turnoMapper;
    }

    @Override
    public PageImpl<TurnoCajaTableDto> listar(PageableDto<Object> pageable, Integer empresaId) {
        return turnoRepository.listar(pageable, empresaId);
    }

    @Override
    public TurnoCajaDto obtenerPorId(Long id, Integer empresaId) {
        TurnoCajaEntity entity = turnoJPARepository.findByIdAndCajaSucursalEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Turno no encontrado"));
        return turnoMapper.toDto(entity);
    }

    @Override
    public TurnoCajaDto obtenerTurnoActivo(Long usuarioId) {
        return turnoRepository.obtenerTurnoActivo(usuarioId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "No hay turno activo"));
    }

    @Override
    @Transactional
    public TurnoCajaDto abrir(AbrirTurnoDto dto, Integer empresaId, Long usuarioId) {
        // Validar que la caja exista y pertenezca a la empresa
        CajaEntity caja = cajaJPARepository.findByIdAndSucursalEmpresaId(dto.getCajaId(), empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.BAD_REQUEST, "Caja no encontrada"));

        if (!caja.getActiva())
            throw new GlobalException(HttpStatus.BAD_REQUEST, "La caja está inactiva");

        // Validar que la caja no tenga turno abierto
        if (turnoJPARepository.findByCajaIdAndEstado(dto.getCajaId(), "ABIERTA").isPresent())
            throw new GlobalException(HttpStatus.BAD_REQUEST, "La caja ya tiene un turno abierto");

        // Validar que el usuario no tenga turno abierto en otra caja
        if (turnoJPARepository.findByUsuarioIdAndEstado(usuarioId, "ABIERTA").isPresent())
            throw new GlobalException(HttpStatus.BAD_REQUEST, "Ya tienes un turno abierto en otra caja");

        UsuarioEntity usuario = usuarioJPARepository.findById(usuarioId.intValue())
                .orElseThrow(() -> new GlobalException(HttpStatus.INTERNAL_SERVER_ERROR, "Usuario no encontrado"));

        TurnoCajaEntity turno = new TurnoCajaEntity();
        turno.setCaja(caja);
        turno.setUsuario(usuario);
        turno.setBaseInicial(dto.getBaseInicial());
        turno.setFechaApertura(LocalDateTime.now());
        turno.setEstado("ABIERTA");

        return turnoMapper.toDto(turnoJPARepository.save(turno));
    }

    @Override
    @Transactional
    public ResumenTurnoDto cerrar(Long id, CerrarTurnoDto dto, Integer empresaId) {
        TurnoCajaEntity turno = turnoJPARepository.findByIdAndCajaSucursalEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        if (turno.getEstado().equals("CERRADA"))
            throw new GlobalException(HttpStatus.BAD_REQUEST, "El turno ya está cerrado");

        // Tu lógica existente — sin cambios
        BigDecimal totalSistema = turnoRepository.calcularTotalEfectivoSistema(id);

        turno.setFechaCierre(LocalDateTime.now());
        turno.setTotalEfectivoSistema(totalSistema);
        turno.setTotalEfectivoReal(dto.getTotalEfectivoReal());
        turno.setDiferencia(dto.getTotalEfectivoReal().subtract(totalSistema));
        turno.setEstado("CERRADA");
        turnoJPARepository.save(turno);

        // Nuevo: retornar resumen completo en vez del DTO simple
        return construirResumen(id);
    }
    @Override
    public ResumenTurnoDto resumen(Long id, Integer empresaId) {
        // Validar que el turno pertenezca a la empresa
        turnoJPARepository.findByIdAndCajaSucursalEmpresaId(id, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        return construirResumen(id);
    }
    private ResumenTurnoDto construirResumen(Long turnoId) {
        // Datos base del turno (reutiliza tu obtenerTurnoActivo modificado o el mapper)
        TurnoCajaEntity entity = turnoJPARepository.findById(turnoId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        TurnoCajaDto turnoDto = turnoMapper.toDto(entity);

        // Desglose calculado desde ventas
        var porCategoria  = turnoRepository.ventasPorCategoria(turnoId);
        var porMetodoPago = turnoRepository.ventasPorMetodoPago(turnoId);
        var totales       = turnoRepository.totalesGenerales(turnoId);

        ResumenTurnoDto resumen = new ResumenTurnoDto();

        // Info turno
        resumen.setTurnoId(turnoDto.getId());
        resumen.setCajaNombre(turnoDto.getCajaNombre());
        resumen.setUsuarioNombre(turnoDto.getUsuarioNombre());
        resumen.setFechaApertura(turnoDto.getFechaApertura() != null
            ? turnoDto.getFechaApertura().toString() : null);
        resumen.setBaseInicial(entity.getBaseInicial());
        resumen.setEstado(entity.getEstado());

        // Desglose
        resumen.setVentasPorCategoria(porCategoria);
        resumen.setVentasPorMetodoPago(porMetodoPago);

        // Totales calculados
        resumen.setTotalVentasBruto(toBD(totales.get("total_ventas_bruto")));
        resumen.setTotalDescuentos(toBD(totales.get("total_descuentos")));
        resumen.setTotalImpuestos(toBD(totales.get("total_impuestos")));
        resumen.setTotalNeto(toBD(totales.get("total_neto")));
        resumen.setTotalTransacciones(toInt(totales.get("total_transacciones")));

        // Efectivo (disponible al cerrar, null si aún está abierto)
        resumen.setTotalEfectivoSistema(entity.getTotalEfectivoSistema());
        resumen.setTotalEfectivoReal(entity.getTotalEfectivoReal());
        resumen.setDiferencia(entity.getDiferencia());

        return resumen;
    }

    private BigDecimal toBD(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        return new BigDecimal(val.toString());
    }

    private Integer toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Integer i) return i;
        return Integer.parseInt(val.toString());
    }
}
