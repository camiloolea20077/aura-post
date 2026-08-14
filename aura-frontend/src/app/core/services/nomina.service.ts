import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AddNovedadDto,
  CreateEmpleadoDto,
  CreatePeriodoDto,
  CreateUsuarioFromEmpleadoDto,
  EmpleadoModel,
  EmpleadoTableModel,
  HistorialPagoModel,
  NominaConfigModel,
  NominaModel,
  NominaPageableDto,
  NominaTableModel,
  PagoNominaDto,
  PeriodoNominaModel,
  SaldosInicialesModel,
  VacacionesSaldoModel,
  PeriodoResumenModel,
  UpdateNominaConfigDto,
} from '../models/nomina.model';
import { ProcesoModel } from '../models/proceso.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ─── Config ─────────────────────────────────────────────────
  getConfig(): Observable<ResponseModel<NominaConfigModel>> {
    return this.http.get<ResponseModel<NominaConfigModel>>(
      `${this.base}nomina/config`,
    );
  }

  saveConfig(
    dto: UpdateNominaConfigDto,
  ): Observable<ResponseModel<NominaConfigModel>> {
    return this.http.put<ResponseModel<NominaConfigModel>>(
      `${this.base}nomina/config`,
      dto,
    );
  }

  // ─── Empleados ──────────────────────────────────────────────
  pageEmpleados(
    dto: NominaPageableDto,
  ): Observable<ResponseTableModel<EmpleadoTableModel>> {
    return this.http.post<ResponseTableModel<EmpleadoTableModel>>(
      `${this.base}empleados/page`,
      dto,
    );
  }

  getEmpleadoById(id: number): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.get<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/${id}`,
    );
  }

  /** Empleados con contrato activo (para prestaciones/nómina). */
  empleadosConContratoActivo(): Observable<ResponseModel<EmpleadoModel[]>> {
    return this.http.get<ResponseModel<EmpleadoModel[]>>(
      `${this.base}empleados/con-contrato-activo`,
    );
  }

  createEmpleado(
    dto: CreateEmpleadoDto,
  ): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.post<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/create`,
      dto,
    );
  }

  /** Alta de empleado desde un tercero ya creado (identidad+banco en tercero). */
  crearEmpleadoDesdeTercero(
    terceroId: number,
    cargo?: string | null,
  ): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.post<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/desde-tercero`,
      { terceroId, cargo: cargo ?? null },
    );
  }

  /** Marca si el empleado requiere control de asistencia (config MIXTA). */
  cambiarControlAsistencia(
    id: number,
    requiere: boolean,
  ): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.put<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/${id}/control-asistencia?requiere=${requiere}`,
      {},
    );
  }

  updateEmpleado(
    id: number,
    dto: CreateEmpleadoDto,
  ): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.put<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/${id}`,
      dto,
    );
  }

  retirarEmpleado(id: number): Observable<ResponseModel<void>> {
    return this.http.put<ResponseModel<void>>(
      `${this.base}empleados/${id}/retirar`,
      {},
    );
  }

  createUsuarioFromEmpleado(
    dto: CreateUsuarioFromEmpleadoDto,
  ): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(
      `${this.base}usuarios/create-from-empleado`,
      dto,
    );
  }

  // ─── Períodos ───────────────────────────────────────────────
  listPeriodos(): Observable<ResponseModel<PeriodoNominaModel[]>> {
    return this.http.get<ResponseModel<PeriodoNominaModel[]>>(
      `${this.base}periodos-nomina`,
    );
  }

  createPeriodo(
    dto: CreatePeriodoDto,
  ): Observable<ResponseModel<PeriodoNominaModel>> {
    return this.http.post<ResponseModel<PeriodoNominaModel>>(
      `${this.base}periodos-nomina/create`,
      dto,
    );
  }

  anularPeriodo(id: number): Observable<ResponseModel<PeriodoNominaModel>> {
    return this.http.put<ResponseModel<PeriodoNominaModel>>(
      `${this.base}periodos-nomina/${id}/anular`,
      {},
    );
  }

  // ─── Nómina ─────────────────────────────────────────────────
  pageNomina(
    dto: NominaPageableDto,
  ): Observable<ResponseTableModel<NominaTableModel>> {
    return this.http.post<ResponseTableModel<NominaTableModel>>(
      `${this.base}nomina/page`,
      dto,
    );
  }

  getNominaById(id: number): Observable<ResponseModel<NominaModel>> {
    return this.http.get<ResponseModel<NominaModel>>(
      `${this.base}nomina/${id}`,
    );
  }

  /** Trazabilidad de pagos de un empleado (nóminas no anuladas, recientes primero). */
  historialPagos(
    empleadoId: number,
  ): Observable<ResponseModel<HistorialPagoModel[]>> {
    return this.http.get<ResponseModel<HistorialPagoModel[]>>(
      `${this.base}nomina/empleado/${empleadoId}/historial`,
    );
  }

  /** F3 — saldo de vacaciones de un empleado. */
  vacacionesSaldo(
    empleadoId: number,
  ): Observable<ResponseModel<VacacionesSaldoModel>> {
    return this.http.get<ResponseModel<VacacionesSaldoModel>>(
      `${this.base}nomina/empleado/${empleadoId}/vacaciones-saldo`,
    );
  }

  // ─── F7: saldos iniciales (migración) ───────────────────────
  listarSaldosIniciales(): Observable<ResponseModel<SaldosInicialesModel[]>> {
    return this.http.get<ResponseModel<SaldosInicialesModel[]>>(
      `${this.base}empleados/saldos-iniciales`,
    );
  }

  guardarSaldosIniciales(
    empleadoId: number,
    dto: SaldosInicialesModel,
  ): Observable<ResponseModel<SaldosInicialesModel>> {
    return this.http.put<ResponseModel<SaldosInicialesModel>>(
      `${this.base}empleados/${empleadoId}/saldos-iniciales`,
      dto,
    );
  }

  getResumenPeriodo(
    periodoId: number,
  ): Observable<ResponseModel<PeriodoResumenModel>> {
    return this.http.get<ResponseModel<PeriodoResumenModel>>(
      `${this.base}nomina/periodo/${periodoId}/resumen`,
    );
  }

  pagarNomina(
    id: number,
    dto?: PagoNominaDto,
  ): Observable<ResponseModel<NominaModel>> {
    return this.http.put<ResponseModel<NominaModel>>(
      `${this.base}nomina/${id}/pagar`,
      dto ?? {},
    );
  }

  pagarPeriodo(
    periodoId: number,
    dto: PagoNominaDto,
  ): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(
      `${this.base}nomina/periodo/${periodoId}/pagar-todos`,
      dto,
    );
  }

  liquidar(
    periodoId: number,
    empleadoId: number,
  ): Observable<ResponseModel<NominaModel>> {
    return this.http.post<ResponseModel<NominaModel>>(
      `${this.base}nomina/liquidar/${periodoId}/empleado/${empleadoId}`,
      {},
    );
  }

  /**
   * Lanza la liquidación de todo el período en segundo plano.
   *
   * Responde 202 con el proceso en PENDIENTE; hay que hacer polling con
   * {@link consultarProceso}. Un 409 significa que ya hay una liquidación
   * corriendo para ese período.
   */
  liquidarTodos(periodoId: number): Observable<ResponseModel<ProcesoModel>> {
    return this.http.post<ResponseModel<ProcesoModel>>(
      `${this.base}nomina/liquidar/${periodoId}/todos`,
      {},
    );
  }

  /** Estado de un proceso asíncrono, para el polling. */
  consultarProceso(procesoId: number): Observable<ResponseModel<ProcesoModel>> {
    return this.http.get<ResponseModel<ProcesoModel>>(
      `${this.base}proceso/${procesoId}`,
    );
  }

  agregarNovedad(
    nominaId: number,
    dto: AddNovedadDto,
  ): Observable<ResponseModel<NominaModel>> {
    return this.http.post<ResponseModel<NominaModel>>(
      `${this.base}nomina/${nominaId}/novedades`,
      dto,
    );
  }

  eliminarNovedad(
    nominaId: number,
    novedadId: number,
  ): Observable<ResponseModel<NominaModel>> {
    return this.http.delete<ResponseModel<NominaModel>>(
      `${this.base}nomina/${nominaId}/novedades/${novedadId}`,
    );
  }

  aprobar(id: number): Observable<ResponseModel<NominaModel>> {
    return this.http.put<ResponseModel<NominaModel>>(
      `${this.base}nomina/${id}/aprobar`,
      {},
    );
  }

  anularNomina(id: number): Observable<ResponseModel<NominaModel>> {
    return this.http.put<ResponseModel<NominaModel>>(
      `${this.base}nomina/${id}/anular`,
      {},
    );
  }
}
