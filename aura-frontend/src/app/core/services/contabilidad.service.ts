import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AsientoContableModel, BalanceGeneralModel, BalanceGeneralDetalladoModel,
  CreateAsientoDto, CreateComprobanteDto, CreatePlanCuentaDto, PlanCuentaModel,
  CreateSaldosInicialesDto,
  EstadoResultadosModel, FlujoCajaModel, LibroMayorLineaModel,
} from '../models/contabilidad.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly api = `${environment.apiUrl}contabilidad`;

  constructor(private readonly http: HttpClient) {}

  // ── Plan de Cuentas ──────────────────────────────────────────────
  listarPlan(): Observable<ResponseModel<PlanCuentaModel[]>> {
    return this.http.get<ResponseModel<PlanCuentaModel[]>>(`${this.api}/plan-cuentas`);
  }

  crearCuenta(dto: CreatePlanCuentaDto): Observable<ResponseModel<PlanCuentaModel>> {
    return this.http.post<ResponseModel<PlanCuentaModel>>(`${this.api}/plan-cuentas`, dto);
  }

  actualizarCuenta(id: number, dto: CreatePlanCuentaDto): Observable<ResponseModel<PlanCuentaModel>> {
    return this.http.put<ResponseModel<PlanCuentaModel>>(`${this.api}/plan-cuentas/${id}`, dto);
  }

  eliminarCuenta(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/plan-cuentas/${id}`);
  }

  seedPUC(): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.api}/plan-cuentas/seed`, {});
  }

  // ── Asientos ─────────────────────────────────────────────────────
  listarAsientos(desde: string, hasta: string, tipoOrigen?: string | null,
      page = 0, rows = 20): Observable<ResponseModel<AsientoContableModel[]>> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta)
        .set('page', page).set('rows', rows);
    if (tipoOrigen) params = params.set('tipoOrigen', tipoOrigen);
    return this.http.get<ResponseModel<AsientoContableModel[]>>(`${this.api}/asientos`, { params });
  }

  obtenerAsiento(id: number): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.get<ResponseModel<AsientoContableModel>>(`${this.api}/asientos/${id}`);
  }

  crearAsiento(dto: CreateAsientoDto): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(`${this.api}/asientos`, dto);
  }

  anularAsiento(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/asientos/${id}/anular`, {});
  }

  // ── Bandeja de revisión (E3): aprobar borradores ─────────────────
  asientosPendientes(): Observable<ResponseModel<AsientoContableModel[]>> {
    return this.http.get<ResponseModel<AsientoContableModel[]>>(`${this.api}/asientos/pendientes`);
  }

  asientosDescuadrados(): Observable<ResponseModel<AsientoContableModel[]>> {
    return this.http.get<ResponseModel<AsientoContableModel[]>>(`${this.api}/asientos/descuadrados`);
  }

  contabilizarBorrador(id: number): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(`${this.api}/asientos/${id}/contabilizar`, {});
  }

  contabilizarMasivo(desde: string, hasta: string, tipoOrigen?: string | null): Observable<ResponseModel<number>> {
    const body: Record<string, string> = { desde, hasta };
    if (tipoOrigen) body['tipoOrigen'] = tipoOrigen;
    return this.http.post<ResponseModel<number>>(`${this.api}/asientos/contabilizar-masivo`, body);
  }

  // ── Comprobantes manuales (CD/CE/RC) ──────────────────────────────
  crearComprobante(dto: CreateComprobanteDto): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(`${this.api}/comprobantes`, dto);
  }

  siguienteConsecutivo(tipo: string): Observable<ResponseModel<string>> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<ResponseModel<string>>(`${this.api}/comprobantes/siguiente`, { params });
  }

  // ── Saldos iniciales / apertura ────────────────────────────────────
  obtenerApertura(): Observable<ResponseModel<AsientoContableModel | null>> {
    return this.http.get<ResponseModel<AsientoContableModel | null>>(`${this.api}/saldos-iniciales`);
  }

  guardarApertura(dto: CreateSaldosInicialesDto): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(`${this.api}/saldos-iniciales`, dto);
  }

  eliminarApertura(): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/saldos-iniciales`);
  }

  // ── Balance ───────────────────────────────────────────────────────
  balanceGeneral(hasta?: string): Observable<ResponseModel<BalanceGeneralModel>> {
    let params = new HttpParams();
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<BalanceGeneralModel>>(`${this.api}/balance`, { params });
  }

  // Balance General profesional (detalle por cuenta, corriente/no corriente)
  balanceGeneralDetallado(hasta?: string): Observable<ResponseModel<BalanceGeneralDetalladoModel>> {
    let params = new HttpParams();
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<BalanceGeneralDetalladoModel>>(`${this.api}/balance-detallado`, { params });
  }

  // ── Estado de Resultados (P&G) ────────────────────────────────────
  // E7: filtros de dimensión opcionales (centro de costo / proyecto / frente)
  estadoResultados(desde?: string, hasta?: string, centroCostoId?: number | null,
      proyectoId?: number | null, frenteId?: number | null): Observable<ResponseModel<EstadoResultadosModel>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (centroCostoId) params = params.set('centroCostoId', centroCostoId);
    if (proyectoId) params = params.set('proyectoId', proyectoId);
    if (frenteId) params = params.set('frenteId', frenteId);
    return this.http.get<ResponseModel<EstadoResultadosModel>>(`${this.api}/estado-resultados`, { params });
  }

  // ── Libro Mayor ───────────────────────────────────────────────────
  libroMayor(cuentaId: number, desde: string, hasta: string, centroCostoId?: number | null,
      proyectoId?: number | null, frenteId?: number | null): Observable<ResponseModel<LibroMayorLineaModel[]>> {
    let params = new HttpParams().set('cuentaId', cuentaId).set('desde', desde).set('hasta', hasta);
    if (centroCostoId) params = params.set('centroCostoId', centroCostoId);
    if (proyectoId) params = params.set('proyectoId', proyectoId);
    if (frenteId) params = params.set('frenteId', frenteId);
    return this.http.get<ResponseModel<LibroMayorLineaModel[]>>(`${this.api}/libro-mayor`, { params });
  }

  // ── Flujo de Caja ─────────────────────────────────────────────────
  flujoCaja(desde?: string, hasta?: string): Observable<ResponseModel<FlujoCajaModel>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<FlujoCajaModel>>(`${this.api}/flujo-caja`, { params });
  }

  // ── Asientos automáticos ──────────────────────────────────────────
  generarDesdeVenta(ventaId: number): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/generar-desde-venta/${ventaId}`, {});
  }

  generarDesdeCompra(compraId: number): Observable<ResponseModel<AsientoContableModel>> {
    return this.http.post<ResponseModel<AsientoContableModel>>(
      `${this.api}/asientos/generar-desde-compra/${compraId}`, {});
  }
}
