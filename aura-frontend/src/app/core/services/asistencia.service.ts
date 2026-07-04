import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AsistenciaDiaModel,
  AsistenciaNovedadModel,
  AuditoriaModel,
  AutorizacionModel,
  CrearAutorizacionDto,
  CrearIncidenciaDto,
  CrearPeriodoAsistenciaDto,
  CreateEmpleadoTurnoDto,
  CreateMarcajeDto,
  CreateTurnoDto,
  EmpleadoTurnoModel,
  IncidenciaModel,
  MarcajeModel,
  PeriodoAsistenciaModel,
  PreliquidacionItemModel,
  RevisarIncidenciaDto,
  TurnoModel,
} from '../models/asistencia.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ─── Turnos ─────────────────────────────────────────────────
  listTurnos(soloActivos = false): Observable<ResponseModel<TurnoModel[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ResponseModel<TurnoModel[]>>(
      `${this.base}asistencia/turnos`,
      { params },
    );
  }
  createTurno(dto: CreateTurnoDto): Observable<ResponseModel<TurnoModel>> {
    return this.http.post<ResponseModel<TurnoModel>>(
      `${this.base}asistencia/turnos`,
      dto,
    );
  }
  updateTurno(
    id: number,
    dto: CreateTurnoDto,
  ): Observable<ResponseModel<TurnoModel>> {
    return this.http.put<ResponseModel<TurnoModel>>(
      `${this.base}asistencia/turnos/${id}`,
      dto,
    );
  }
  deleteTurno(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.base}asistencia/turnos/${id}`,
    );
  }

  // ─── Asignaciones ───────────────────────────────────────────
  listAsignaciones(
    empleadoId: number,
  ): Observable<ResponseModel<EmpleadoTurnoModel[]>> {
    return this.http.get<ResponseModel<EmpleadoTurnoModel[]>>(
      `${this.base}asistencia/turnos/asignaciones/empleado/${empleadoId}`,
    );
  }
  asignarTurno(
    dto: CreateEmpleadoTurnoDto,
  ): Observable<ResponseModel<EmpleadoTurnoModel>> {
    return this.http.post<ResponseModel<EmpleadoTurnoModel>>(
      `${this.base}asistencia/turnos/asignaciones`,
      dto,
    );
  }
  eliminarAsignacion(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.base}asistencia/turnos/asignaciones/${id}`,
    );
  }

  // ─── Marcajes ───────────────────────────────────────────────
  registrarMarcaje(
    dto: CreateMarcajeDto,
  ): Observable<ResponseModel<MarcajeModel>> {
    return this.http.post<ResponseModel<MarcajeModel>>(
      `${this.base}asistencia/marcajes`,
      dto,
    );
  }
  listMarcajes(
    empleadoId: number,
    fecha: string,
  ): Observable<ResponseModel<MarcajeModel[]>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<ResponseModel<MarcajeModel[]>>(
      `${this.base}asistencia/marcajes/empleado/${empleadoId}`,
      { params },
    );
  }
  anularMarcaje(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.base}asistencia/marcajes/${id}`,
    );
  }

  // ─── Consolidación ──────────────────────────────────────────
  consolidarDia(
    empleadoId: number,
    fecha: string,
  ): Observable<ResponseModel<AsistenciaDiaModel>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.post<ResponseModel<AsistenciaDiaModel>>(
      `${this.base}asistencia/consolidar/empleado/${empleadoId}`,
      {},
      { params },
    );
  }
  consolidarRango(
    desde: string,
    hasta: string,
  ): Observable<ResponseModel<AsistenciaDiaModel[]>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.post<ResponseModel<AsistenciaDiaModel[]>>(
      `${this.base}asistencia/consolidar/rango`,
      {},
      { params },
    );
  }
  listDias(
    empleadoId: number,
    desde: string,
    hasta: string,
  ): Observable<ResponseModel<AsistenciaDiaModel[]>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResponseModel<AsistenciaDiaModel[]>>(
      `${this.base}asistencia/dias/empleado/${empleadoId}`,
      { params },
    );
  }

  // ─── Incidencias ────────────────────────────────────────────
  generarIncidencias(
    empleadoId: number,
    fecha: string,
  ): Observable<ResponseModel<IncidenciaModel[]>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.post<ResponseModel<IncidenciaModel[]>>(
      `${this.base}asistencia/revision/incidencias/generar/empleado/${empleadoId}`,
      {},
      { params },
    );
  }
  listIncidencias(
    empleadoId: number,
    desde: string,
    hasta: string,
  ): Observable<ResponseModel<IncidenciaModel[]>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResponseModel<IncidenciaModel[]>>(
      `${this.base}asistencia/revision/incidencias/empleado/${empleadoId}`,
      { params },
    );
  }
  crearIncidencia(
    dto: CrearIncidenciaDto,
  ): Observable<ResponseModel<IncidenciaModel>> {
    return this.http.post<ResponseModel<IncidenciaModel>>(
      `${this.base}asistencia/revision/incidencias`,
      dto,
    );
  }
  revisarIncidencia(
    id: number,
    dto: RevisarIncidenciaDto,
  ): Observable<ResponseModel<IncidenciaModel>> {
    return this.http.put<ResponseModel<IncidenciaModel>>(
      `${this.base}asistencia/revision/incidencias/${id}/revisar`,
      dto,
    );
  }

  // ─── Aprobación de día ──────────────────────────────────────
  aprobarDia(diaId: number): Observable<ResponseModel<AsistenciaDiaModel>> {
    return this.http.put<ResponseModel<AsistenciaDiaModel>>(
      `${this.base}asistencia/revision/dias/${diaId}/aprobar`,
      {},
    );
  }
  rechazarDia(
    diaId: number,
    observacion: string | null,
  ): Observable<ResponseModel<AsistenciaDiaModel>> {
    return this.http.put<ResponseModel<AsistenciaDiaModel>>(
      `${this.base}asistencia/revision/dias/${diaId}/rechazar`,
      { observacion },
    );
  }

  // ─── Período de asistencia ──────────────────────────────────
  listPeriodosAsistencia(): Observable<
    ResponseModel<PeriodoAsistenciaModel[]>
  > {
    return this.http.get<ResponseModel<PeriodoAsistenciaModel[]>>(
      `${this.base}asistencia/revision/periodos`,
    );
  }
  crearPeriodoAsistencia(
    dto: CrearPeriodoAsistenciaDto,
  ): Observable<ResponseModel<PeriodoAsistenciaModel>> {
    return this.http.post<ResponseModel<PeriodoAsistenciaModel>>(
      `${this.base}asistencia/revision/periodos`,
      dto,
    );
  }
  cerrarPeriodoAsistencia(
    id: number,
  ): Observable<ResponseModel<PeriodoAsistenciaModel>> {
    return this.http.put<ResponseModel<PeriodoAsistenciaModel>>(
      `${this.base}asistencia/revision/periodos/${id}/cerrar`,
      {},
    );
  }
  aprobarPeriodoAsistencia(
    id: number,
  ): Observable<ResponseModel<PeriodoAsistenciaModel>> {
    return this.http.put<ResponseModel<PeriodoAsistenciaModel>>(
      `${this.base}asistencia/revision/periodos/${id}/aprobar`,
      {},
    );
  }
  enviarPeriodoANomina(
    id: number,
  ): Observable<ResponseModel<PeriodoAsistenciaModel>> {
    return this.http.put<ResponseModel<PeriodoAsistenciaModel>>(
      `${this.base}asistencia/revision/periodos/${id}/enviar-nomina`,
      {},
    );
  }

  // ─── Novedades de asistencia ────────────────────────────────
  generarNovedades(
    periodoNominaId: number,
  ): Observable<ResponseModel<AsistenciaNovedadModel[]>> {
    return this.http.post<ResponseModel<AsistenciaNovedadModel[]>>(
      `${this.base}asistencia/novedades/generar/periodo/${periodoNominaId}`,
      {},
    );
  }
  listNovedades(
    periodoNominaId: number,
  ): Observable<ResponseModel<AsistenciaNovedadModel[]>> {
    return this.http.get<ResponseModel<AsistenciaNovedadModel[]>>(
      `${this.base}asistencia/novedades/periodo/${periodoNominaId}`,
    );
  }
  aprobarNovedad(
    id: number,
  ): Observable<ResponseModel<AsistenciaNovedadModel>> {
    return this.http.put<ResponseModel<AsistenciaNovedadModel>>(
      `${this.base}asistencia/novedades/${id}/aprobar`,
      {},
    );
  }
  rechazarNovedad(
    id: number,
  ): Observable<ResponseModel<AsistenciaNovedadModel>> {
    return this.http.put<ResponseModel<AsistenciaNovedadModel>>(
      `${this.base}asistencia/novedades/${id}/rechazar`,
      {},
    );
  }

  // ─── Autorizaciones excepcionales ───────────────────────────
  crearAutorizacion(
    dto: CrearAutorizacionDto,
  ): Observable<ResponseModel<AutorizacionModel>> {
    return this.http.post<ResponseModel<AutorizacionModel>>(
      `${this.base}nomina/autorizaciones`,
      dto,
    );
  }
  listAutorizaciones(
    periodoNominaId: number,
  ): Observable<ResponseModel<AutorizacionModel[]>> {
    return this.http.get<ResponseModel<AutorizacionModel[]>>(
      `${this.base}nomina/autorizaciones/periodo/${periodoNominaId}`,
    );
  }
  anularAutorizacion(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.base}nomina/autorizaciones/${id}`,
    );
  }

  // ─── Preliquidación y auditoría ─────────────────────────────
  preliquidacion(
    periodoId: number,
  ): Observable<ResponseModel<PreliquidacionItemModel[]>> {
    return this.http.get<ResponseModel<PreliquidacionItemModel[]>>(
      `${this.base}nomina/preliquidacion/${periodoId}`,
    );
  }
  auditoria(): Observable<ResponseModel<AuditoriaModel[]>> {
    return this.http.get<ResponseModel<AuditoriaModel[]>>(
      `${this.base}nomina/auditoria`,
    );
  }
}
