import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AsientoContableModel,
  BalanceGeneralModel,
  BalanceGeneralDetalladoModel,
  CreateAsientoDto,
  CreateComprobanteDto,
  CreatePlanCuentaDto,
  PlanCuentaModel,
  CreateSaldosInicialesDto,
  DashboardContableModel,
  DocumentoSinAsientoModel,
  EstadoResultadosModel,
  FlujoCajaModel,
  LibroMayorLineaModel,
} from '../models/contabilidad.model';
import { CategoriaContableProductoModel } from '../models/producto.model';
import {
  BalancePruebaModel,
  ConfigLogModel,
  CuentaConfigModel,
  FormaPagoContableModel,
  ImpuestoModel,
  ResumenTrasladoModel,
  SugerenciaSaldoInicialModel,
  VistaPreviaAsientoModel,
  VistaPreviaCompraRequest,
} from '../models/contador.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly api = `${environment.apiUrl}contabilidad`;

  constructor(private readonly http: HttpClient) {}

  // ── Plan de Cuentas ──────────────────────────────────────────────
  listarPlan(): Observable<ResponseModel<PlanCuentaModel[]>> {
    return this.http.get<ResponseModel<PlanCuentaModel[]>>(
      `${this.api}/plan-cuentas`,
    );
  }

  // ── Categorías contables de producto (E4) ────────────────────────
  listarCategoriasProducto(): Observable<
    ResponseModel<CategoriaContableProductoModel[]>
  > {
    return this.http.get<ResponseModel<CategoriaContableProductoModel[]>>(
      `${this.api}/categorias-producto`,
    );
  }

  crearCategoriaProducto(
    dto: Partial<CategoriaContableProductoModel>,
  ): Observable<ResponseModel<CategoriaContableProductoModel>> {
    return this.http.post<ResponseModel<CategoriaContableProductoModel>>(
      `${this.api}/categorias-producto`,
      dto,
    );
  }

  actualizarCategoriaProducto(
    id: number,
    dto: Partial<CategoriaContableProductoModel>,
  ): Observable<ResponseModel<CategoriaContableProductoModel>> {
    return this.http.put<ResponseModel<CategoriaContableProductoModel>>(
      `${this.api}/categorias-producto/${id}`,
      dto,
    );
  }

  /**
   * Cuentas habilitadas como origen de un pago: caja, caja menor, bancos y las
   * cuentas puente de fondos sin legalizar.
   *
   * <p>Alimenta el combo "¿De dónde sale la plata?". Antes el front filtraba el
   * plan completo por tipo ACTIVO/PASIVO, que dejaba pasar cualquier cuenta de
   * activo — inventarios, cartera — como si fuera un medio de pago. Ahora la
   * lista la decide el contador con un flag y el backend la valida igual.
   */
  listarMediosPago(): Observable<ResponseModel<PlanCuentaModel[]>> {
    return this.http.get<ResponseModel<PlanCuentaModel[]>>(
      `${this.api}/plan-cuentas/medios-pago`,
    );
  }

  crearCuenta(
    dto: CreatePlanCuentaDto,
  ): Observable<ResponseModel<PlanCuentaModel>> {
    return this.http.post<ResponseModel<PlanCuentaModel>>(
      `${this.api}/plan-cuentas`,
      dto,
    );
  }

  actualizarCuenta(
    id: number,
    dto: CreatePlanCuentaDto,
  ): Observable<ResponseModel<PlanCuentaModel>> {
    return this.http.put<ResponseModel<PlanCuentaModel>>(
      `${this.api}/plan-cuentas/${id}`,
      dto,
    );
  }

  eliminarCuenta(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.api}/plan-cuentas/${id}`,
    );
  }

  seedPUC(): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(
      `${this.api}/plan-cuentas/seed`,
      {},
    );
  }

  // ── Asientos ─────────────────────────────────────────────────────
  listarAsientos(
    desde: string,
    hasta: string,
    tipoOrigen?: string | null,
    page = 0,
    rows = 20,
  ): Observable<ResponseModel<AsientoContableModel[]>> {
    let params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('page', page)
      .set('rows', rows);
    if (tipoOrigen) params = params.set('tipoOrigen', tipoOrigen);
    return this.http.get<ResponseModel<AsientoContableModel[]>>(
      `${this.api}/asientos`,
      { params },
    );
  }

  obtenerAsiento(id: number): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.get<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/${id}`,
    );
  }

  crearAsiento(
    dto: CreateAsientoDto,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos`,
      dto,
    );
  }

  anularAsiento(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(
      `${this.api}/asientos/${id}/anular`,
      {},
    );
  }

  // ── Bandeja de revisión (E3): aprobar borradores ─────────────────
  asientosPendientes(): Observable<ResponseModel<AsientoContableModel[]>> {
    return this.http.get<ResponseModel<AsientoContableModel[]>>(
      `${this.api}/asientos/pendientes`,
    );
  }

  /** Documentos sin exactamente un asiento vigente en el rango (por defecto, el año). */
  documentosSinAsiento(desde?: string, hasta?: string): Observable<ResponseModel<DocumentoSinAsientoModel[]>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<DocumentoSinAsientoModel[]>>(
      `${this.api}/asientos/sin-asiento`,
      { params },
    );
  }

  /** Genera el asiento de un documento que no lo tiene (idempotente). */
  reprocesarDocumento(tipoOrigen: string, origenId: number): Observable<ResponseModel<number | null>> {
    return this.http.post<ResponseModel<number | null>>(
      `${this.api}/asientos/reprocesar`,
      { tipoOrigen, origenId },
    );
  }

  asientosDescuadrados(): Observable<ResponseModel<AsientoContableModel[]>> {
    return this.http.get<ResponseModel<AsientoContableModel[]>>(
      `${this.api}/asientos/descuadrados`,
    );
  }

  contabilizarBorrador(
    id: number,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/${id}/contabilizar`,
      {},
    );
  }

  contabilizarMasivo(
    desde: string,
    hasta: string,
    tipoOrigen?: string | null,
  ): Observable<ResponseModel<number>> {
    const body: Record<string, string> = { desde, hasta };
    if (tipoOrigen) body['tipoOrigen'] = tipoOrigen;
    return this.http.post<ResponseModel<number>>(
      `${this.api}/asientos/contabilizar-masivo`,
      body,
    );
  }

  // ── Comprobantes manuales (CD/CE/RC) ──────────────────────────────
  crearComprobante(
    dto: CreateComprobanteDto,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/comprobantes`,
      dto,
    );
  }

  siguienteConsecutivo(tipo: string): Observable<ResponseModel<string>> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<ResponseModel<string>>(
      `${this.api}/comprobantes/siguiente`,
      { params },
    );
  }

  // ── Saldos iniciales / apertura ────────────────────────────────────
  obtenerApertura(): Observable<ResponseModel<AsientoContableModel | null>> {
    return this.http.get<ResponseModel<AsientoContableModel | null>>(
      `${this.api}/saldos-iniciales`,
    );
  }

  guardarApertura(
    dto: CreateSaldosInicialesDto,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/saldos-iniciales`,
      dto,
    );
  }

  eliminarApertura(): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.api}/saldos-iniciales`,
    );
  }

  // ── Balance ───────────────────────────────────────────────────────
  balanceGeneral(
    hasta?: string,
  ): Observable<ResponseModel<BalanceGeneralModel>> {
    let params = new HttpParams();
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<BalanceGeneralModel>>(
      `${this.api}/balance`,
      { params },
    );
  }

  // Balance General profesional (detalle por cuenta, corriente/no corriente)
  balanceGeneralDetallado(
    hasta?: string,
  ): Observable<ResponseModel<BalanceGeneralDetalladoModel>> {
    let params = new HttpParams();
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<BalanceGeneralDetalladoModel>>(
      `${this.api}/balance-detallado`,
      { params },
    );
  }

  // ── Estado de Resultados (P&G) ────────────────────────────────────
  // E7: filtros de dimensión opcionales (centro de costo / proyecto / frente)
  estadoResultados(
    desde?: string,
    hasta?: string,
    centroCostoId?: number | null,
    proyectoId?: number | null,
    frenteId?: number | null,
  ): Observable<ResponseModel<EstadoResultadosModel>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (centroCostoId) params = params.set('centroCostoId', centroCostoId);
    if (proyectoId) params = params.set('proyectoId', proyectoId);
    if (frenteId) params = params.set('frenteId', frenteId);
    return this.http.get<ResponseModel<EstadoResultadosModel>>(
      `${this.api}/estado-resultados`,
      { params },
    );
  }

  // ── Centro de Contabilidad ────────────────────────────────────────
  /** Resumen del mes: KPIs, serie enero..mes, gastos por grupo y pendientes. */
  dashboard(anio: number, mes: number): Observable<ResponseModel<DashboardContableModel>> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ResponseModel<DashboardContableModel>>(
      `${this.api}/dashboard`,
      { params },
    );
  }

  // ── Libro Mayor ───────────────────────────────────────────────────
  libroMayor(
    cuentaId: number,
    desde: string,
    hasta: string,
    centroCostoId?: number | null,
    proyectoId?: number | null,
    frenteId?: number | null,
  ): Observable<ResponseModel<LibroMayorLineaModel[]>> {
    let params = new HttpParams()
      .set('cuentaId', cuentaId)
      .set('desde', desde)
      .set('hasta', hasta);
    if (centroCostoId) params = params.set('centroCostoId', centroCostoId);
    if (proyectoId) params = params.set('proyectoId', proyectoId);
    if (frenteId) params = params.set('frenteId', frenteId);
    return this.http.get<ResponseModel<LibroMayorLineaModel[]>>(
      `${this.api}/libro-mayor`,
      { params },
    );
  }

  // ── Flujo de Caja ─────────────────────────────────────────────────
  flujoCaja(
    desde?: string,
    hasta?: string,
  ): Observable<ResponseModel<FlujoCajaModel>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<FlujoCajaModel>>(
      `${this.api}/flujo-caja`,
      { params },
    );
  }

  // ── Asientos automáticos ──────────────────────────────────────────
  generarDesdeVenta(
    ventaId: number,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/generar-desde-venta/${ventaId}`,
      {},
    );
  }

  generarDesdeCompra(
    compraId: number,
  ): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/generar-desde-compra/${compraId}`,
      {},
    );
  }

  // ── Fase 4: parametrización ──────────────────────────────────────
  private readonly base = environment.apiUrl;

  listarConfigCuentas(): Observable<ResponseModel<CuentaConfigModel[]>> {
    return this.http.get<ResponseModel<CuentaConfigModel[]>>(`${this.api}/configuracion-cuentas`);
  }

  actualizarConfigCuenta(concepto: string, cuentaId: number): Observable<ResponseModel<CuentaConfigModel>> {
    return this.http.put<ResponseModel<CuentaConfigModel>>(`${this.api}/configuracion-cuentas/${concepto}`, { cuentaId });
  }

  logConfigCuentas(): Observable<ResponseModel<ConfigLogModel[]>> {
    return this.http.get<ResponseModel<ConfigLogModel[]>>(`${this.api}/configuracion-cuentas/log`);
  }

  obtenerModo(): Observable<ResponseModel<string>> {
    return this.http.get<ResponseModel<string>>(`${this.api}/configuracion-cuentas/modo`);
  }

  actualizarModo(modo: string): Observable<ResponseModel<string>> {
    return this.http.put<ResponseModel<string>>(`${this.api}/configuracion-cuentas/modo`, { modo });
  }

  listarFormasPago(): Observable<ResponseModel<FormaPagoContableModel[]>> {
    return this.http.get<ResponseModel<FormaPagoContableModel[]>>(`${this.api}/formas-pago`);
  }

  crearFormaPago(dto: FormaPagoContableModel): Observable<ResponseModel<FormaPagoContableModel>> {
    return this.http.post<ResponseModel<FormaPagoContableModel>>(`${this.api}/formas-pago`, dto);
  }

  actualizarFormaPago(id: number, dto: FormaPagoContableModel): Observable<ResponseModel<FormaPagoContableModel>> {
    return this.http.put<ResponseModel<FormaPagoContableModel>>(`${this.api}/formas-pago/${id}`, dto);
  }

  copiarFormaPago(id: number, destinoIds: number[]): Observable<ResponseModel<number>> {
    return this.http.post<ResponseModel<number>>(`${this.api}/formas-pago/${id}/copiar`, { destinoIds });
  }

  listarImpuestos(): Observable<ResponseModel<ImpuestoModel[]>> {
    return this.http.get<ResponseModel<ImpuestoModel[]>>(`${this.api}/impuestos`);
  }

  actualizarImpuesto(id: number, dto: ImpuestoModel): Observable<ResponseModel<ImpuestoModel>> {
    return this.http.put<ResponseModel<ImpuestoModel>>(`${this.api}/impuestos/${id}`, dto);
  }

  copiarCategoriaProducto(id: number, nombre: string): Observable<ResponseModel<CategoriaContableProductoModel>> {
    return this.http.post<ResponseModel<CategoriaContableProductoModel>>(
      `${this.api}/categorias-producto/${id}/copiar`,
      { nombre },
    );
  }

  // ── Fase 4: vista previa, saldos iniciales, balance, herramientas ─
  vistaPreviaCompra(dto: VistaPreviaCompraRequest): Observable<ResponseModel<VistaPreviaAsientoModel>> {
    return this.http.post<ResponseModel<VistaPreviaAsientoModel>>(
      `${this.api}/herramientas/vista-previa/compra`,
      dto,
    );
  }

  sugerenciasSaldoInicial(fuente: string): Observable<ResponseModel<SugerenciaSaldoInicialModel[]>> {
    return this.http.get<ResponseModel<SugerenciaSaldoInicialModel[]>>(`${this.api}/saldos-iniciales/sugerencias`, {
      params: new HttpParams().set('fuente', fuente),
    });
  }

  balancePrueba(filtros: Record<string, string | number | boolean | null | undefined>): Observable<ResponseModel<BalancePruebaModel>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ResponseModel<BalancePruebaModel>>(`${this.base}reportes-contables/balance-prueba`, { params });
  }

  vistaPreviaTraslado(p: {
    origenId: number;
    destinoId: number;
    desde: string;
    hasta: string;
    terceroId?: number | null;
  }): Observable<ResponseModel<ResumenTrasladoModel>> {
    let params = new HttpParams()
      .set('origenId', p.origenId)
      .set('destinoId', p.destinoId)
      .set('desde', p.desde)
      .set('hasta', p.hasta);
    if (p.terceroId) params = params.set('terceroId', p.terceroId);
    return this.http.get<ResponseModel<ResumenTrasladoModel>>(`${this.api}/herramientas/traslado-cuentas/vista-previa`, {
      params,
    });
  }

  trasladarCuenta(dto: {
    origenId: number;
    destinoId: number;
    desde: string;
    hasta: string;
    terceroId?: number | null;
    /** Solo estos movimientos; vacío = todos los del rango. */
    detalleIds?: number[] | null;
    motivo: string;
    /** También la configuración que apunta al origen (conceptos, formas de pago…). */
    conConfiguracion?: boolean;
    /** Dejar el origen como agrupadora si queda sin movimientos ni configuración. */
    origenAgrupadora?: boolean;
    /** No mover movimientos: solo la configuración. */
    soloConfiguracion?: boolean;
  }): Observable<ResponseModel<{ lineas: number; configuracion: number; origenAgrupadora: boolean }>> {
    return this.http.post<ResponseModel<{ lineas: number; configuracion: number; origenAgrupadora: boolean }>>(
      `${this.api}/herramientas/traslado-cuentas`,
      dto,
    );
  }

  historialTraslados(): Observable<ResponseModel<any[]>> {
    return this.http.get<ResponseModel<any[]>>(`${this.api}/herramientas/traslado-cuentas/historial`);
  }

  vistaPreviaFusion(origenId: number, destinoId: number): Observable<ResponseModel<Record<string, number>>> {
    return this.http.get<ResponseModel<Record<string, number>>>(`${this.api}/herramientas/fusion-terceros/vista-previa`, {
      params: new HttpParams().set('origenId', origenId).set('destinoId', destinoId),
    });
  }

  fusionarTerceros(dto: { origenId: number; destinoId: number; motivo: string }): Observable<ResponseModel<number>> {
    return this.http.post<ResponseModel<number>>(`${this.api}/herramientas/fusion-terceros`, dto);
  }

  historialFusiones(): Observable<ResponseModel<any[]>> {
    return this.http.get<ResponseModel<any[]>>(`${this.api}/herramientas/fusion-terceros/historial`);
  }
}
