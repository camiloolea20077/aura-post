package com.cloud_technological.aura_pos.services.implementations;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.cloud_technological.aura_pos.dto.caja.AbrirTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.CerrarTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.CreateMovimientoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.MovimientoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.ResumenTurnoDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaDto;
import com.cloud_technological.aura_pos.dto.caja.TurnoCajaTableDto;
import com.cloud_technological.aura_pos.entity.CajaEntity;
import com.cloud_technological.aura_pos.entity.MovimientoCajaEntity;
import com.cloud_technological.aura_pos.entity.TurnoCajaEntity;
import com.cloud_technological.aura_pos.entity.UsuarioEntity;
import com.cloud_technological.aura_pos.entity.AbonoCobrarEntity;
import com.cloud_technological.aura_pos.entity.AbonoPagarEntity;
import com.cloud_technological.aura_pos.entity.CuentaCobrarEntity;
import com.cloud_technological.aura_pos.entity.CuentaPagarEntity;
import com.cloud_technological.aura_pos.mappers.TurnoCajaMapper;
import com.cloud_technological.aura_pos.repositories.caja.CajaJPARepository;
import com.cloud_technological.aura_pos.repositories.cuentas_cobrar.AbonoCobrarJPARepository;
import com.cloud_technological.aura_pos.repositories.cuentas_cobrar.CuentaCobrarJPARepository;
import com.cloud_technological.aura_pos.repositories.cuentas_pagar.AbonoPagarJPARepository;
import com.cloud_technological.aura_pos.repositories.cuentas_pagar.CuentaPagarJPARepository;
import com.cloud_technological.aura_pos.repositories.movimiento_caja.MovimientoCajaJPARepository;
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
    private final MovimientoCajaJPARepository movimientoRepository;
    private final AbonoCobrarJPARepository abonoCobrarRepository;
    private final AbonoPagarJPARepository abonoPagarRepository;
    private final CuentaCobrarJPARepository cuentaCobrarRepository;
    private final CuentaPagarJPARepository cuentaPagarRepository;

    @Autowired
    public TurnoCajaServiceImpl(TurnoCajaQueryRepository turnoRepository,
            TurnoCajaJPARepository turnoJPARepository,
            CajaJPARepository cajaJPARepository,
            UsuarioJPARepository usuarioJPARepository,
            TurnoCajaMapper turnoMapper,
            MovimientoCajaJPARepository movimientoRepository,
            AbonoCobrarJPARepository abonoCobrarRepository,
            AbonoPagarJPARepository abonoPagarRepository,
            CuentaCobrarJPARepository cuentaCobrarRepository,
            CuentaPagarJPARepository cuentaPagarRepository) {
        this.turnoRepository = turnoRepository;
        this.turnoJPARepository = turnoJPARepository;
        this.cajaJPARepository = cajaJPARepository;
        this.usuarioJPARepository = usuarioJPARepository;
        this.turnoMapper = turnoMapper;
        this.movimientoRepository = movimientoRepository;
        this.abonoCobrarRepository = abonoCobrarRepository;
        this.abonoPagarRepository = abonoPagarRepository;
        this.cuentaCobrarRepository = cuentaCobrarRepository;
        this.cuentaPagarRepository = cuentaPagarRepository;
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
        turno.setDiferencia(dto.getTotalEfectivoReal().subtract(turno.getBaseInicial().add(totalSistema)));
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
    @Override
    @Transactional
    public MovimientoCajaDto registrarMovimiento(Long turnoId, CreateMovimientoCajaDto dto, Integer empresaId, Long usuarioId) {
        TurnoCajaEntity turno = turnoJPARepository.findByIdAndCajaSucursalEmpresaId(turnoId, empresaId)
                .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        if ("CERRADA".equals(turno.getEstado()))
            throw new GlobalException(HttpStatus.BAD_REQUEST, "No se pueden registrar movimientos en un turno cerrado");

        UsuarioEntity usuario = usuarioJPARepository.findById(usuarioId.intValue())
                .orElseThrow(() -> new GlobalException(HttpStatus.INTERNAL_SERVER_ERROR, "Usuario no encontrado"));

        MovimientoCajaEntity mov = new MovimientoCajaEntity();
        mov.setTurnoCaja(turno);
        mov.setUsuario(usuario);
        mov.setTipo(dto.getTipo());
        mov.setConcepto(dto.getConcepto());
        mov.setMonto(dto.getMonto());
        mov.setFecha(java.time.LocalDateTime.now());

        if ("INGRESO".equals(dto.getTipo()) && dto.getCuentaCobrarId() != null) {
            CuentaCobrarEntity cuenta = cuentaCobrarRepository.findById(dto.getCuentaCobrarId())
                    .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Cuenta por cobrar no encontrada"));
            
            if (cuenta.getSaldoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
                throw new GlobalException(HttpStatus.BAD_REQUEST, "La cuenta por cobrar ya está pagada");
            }
            
            AbonoCobrarEntity abono = AbonoCobrarEntity.builder()
                    .cuentaCobrar(cuenta)
                    .usuario(usuario)
                    .turnoCaja(turno)
                    .monto(dto.getMonto())
                    .metodoPago("efectivo")
                    .fechaPago(LocalDateTime.now())
                    .build();
            abonoCobrarRepository.save(abono);
            
            cuenta.setTotalAbonado(cuenta.getTotalAbonado().add(dto.getMonto()));
            cuenta.setSaldoPendiente(cuenta.getSaldoPendiente().subtract(dto.getMonto()));
            if (cuenta.getSaldoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
                cuenta.setSaldoPendiente(BigDecimal.ZERO);
                cuenta.setEstado("pagada");
            }
            cuentaCobrarRepository.save(cuenta);
            
            mov.setCuentaCobrarId(dto.getCuentaCobrarId());
        }
        
        if ("EGRESO".equals(dto.getTipo()) && dto.getCuentaPagarId() != null) {
            CuentaPagarEntity cuenta = cuentaPagarRepository.findById(dto.getCuentaPagarId())
                    .orElseThrow(() -> new GlobalException(HttpStatus.NOT_FOUND, "Cuenta por pagar no encontrada"));
            
            if (cuenta.getSaldoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
                throw new GlobalException(HttpStatus.BAD_REQUEST, "La cuenta por pagar ya está pagada");
            }
            
            AbonoPagarEntity abono = AbonoPagarEntity.builder()
                    .cuentaPagar(cuenta)
                    .usuario(usuario)
                    .turnoCaja(turno)
                    .monto(dto.getMonto())
                    .metodoPago("efectivo")
                    .fechaPago(LocalDateTime.now())
                    .build();
            abonoPagarRepository.save(abono);
            
            cuenta.setTotalAbonado(cuenta.getTotalAbonado().add(dto.getMonto()));
            cuenta.setSaldoPendiente(cuenta.getSaldoPendiente().subtract(dto.getMonto()));
            if (cuenta.getSaldoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
                cuenta.setSaldoPendiente(BigDecimal.ZERO);
                cuenta.setEstado("pagada");
            }
            cuentaPagarRepository.save(cuenta);
            
            mov.setCuentaPagarId(dto.getCuentaPagarId());
        }

        MovimientoCajaEntity saved = movimientoRepository.save(mov);
        return toMovimientoDto(saved);
    }

    private MovimientoCajaDto toMovimientoDto(MovimientoCajaEntity e) {
        MovimientoCajaDto dto = new MovimientoCajaDto();
        dto.setId(e.getId());
        dto.setTipo(e.getTipo());
        dto.setConcepto(e.getConcepto());
        dto.setMonto(e.getMonto());
        dto.setFecha(e.getFecha() != null ? e.getFecha().toString() : null);
        dto.setUsuarioNombre(e.getUsuario() != null ? e.getUsuario().getUsername() : null);
        return dto;
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
        // Si el turno está ABIERTA → calcular en vivo desde venta_pago
        // Si está CERRADA → usar los valores ya guardados en la entidad
        if ("ABIERTA".equals(entity.getEstado())) {
            BigDecimal efectivoSistema = turnoRepository.calcularTotalEfectivoSistema(turnoId);
            BigDecimal totalEsperado   = entity.getBaseInicial().add(efectivoSistema);
            resumen.setTotalEfectivoSistema(efectivoSistema);
            resumen.setTotalEsperado(totalEsperado);       // ← base + ventas efectivo
            resumen.setTotalEfectivoReal(null);            // aún no se ha contado
            resumen.setDiferencia(null);                   // aún no hay cuadre
        } else {
            // CERRADA o CERRADA_AUTO → valores definitivos ya guardados
            resumen.setTotalEfectivoSistema(entity.getTotalEfectivoSistema());
            resumen.setTotalEfectivoReal(entity.getTotalEfectivoReal());
            resumen.setDiferencia(entity.getDiferencia());
            resumen.setTotalEsperado(
                entity.getBaseInicial().add(
                    entity.getTotalEfectivoSistema() != null
                        ? entity.getTotalEfectivoSistema()
                        : BigDecimal.ZERO
                )
            );
        }
        // Movimientos manuales (ingresos / egresos)
        List<MovimientoCajaEntity> movEntities = movimientoRepository.findByTurnoCajaIdOrderByFechaAsc(turnoId);
        List<MovimientoCajaDto> movDtos = movEntities.stream().map(this::toMovimientoDto).collect(Collectors.toList());
        BigDecimal totalIngresos = movimientoRepository.sumMontoByTurnoIdAndTipo(turnoId, "INGRESO");
        BigDecimal totalEgresos  = movimientoRepository.sumMontoByTurnoIdAndTipo(turnoId, "EGRESO");
        
        // Sumar abonos de cuentas asociados al turno (abonos directos que tienen turno_caja_id)
        BigDecimal totalAbonosCobrar = abonoCobrarRepository.sumMontoByTurnoCajaId(turnoId);
        BigDecimal totalAbonosPagar = abonoPagarRepository.sumMontoByTurnoCajaId(turnoId);
        
        // Agregar abonos a los totales de ingresos/egresos
        totalIngresos = totalIngresos.add(totalAbonosCobrar != null ? totalAbonosCobrar : BigDecimal.ZERO);
        totalEgresos = totalEgresos.add(totalAbonosPagar != null ? totalAbonosPagar : BigDecimal.ZERO);
        
        resumen.setMovimientos(movDtos);
        resumen.setTotalIngresos(totalIngresos);
        resumen.setTotalEgresos(totalEgresos);

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
