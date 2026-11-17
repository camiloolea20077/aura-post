import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import {
  AsignarFrenteTurnoDto,
  AsignarTrabajadorDto,
  CreateFrenteDto,
  CreateProyectoDto,
  FrenteTableModel,
  FrenteTrabajadorModel,
  FrenteTurnoModel,
  ProyectoDto,
  ProyectoPageableDto,
  ProyectoTableModel,
  UpdateFrenteDto,
  UpdateProyectoDto,
} from '../models/proyecto.model';
import { EmpleadoModel } from '../models/nomina.model';
import {
  AsistenciaFrenteModel,
  CalendarioMesModel,
  FilaMarcajeDto,
  ResultadoMarcajeModel,
  ResultadoRangoModel,
  GuardarBorradorDto,
  PreliquidacionFrenteItem,
  RevisarDetalleItem,
  RevisionFilterDto,
  RevisionTableModel,
} from '../models/asistencia-frente.model';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ── Proyectos ──────────────────────────────────────────────
  page(
    dto: ProyectoPageableDto,
  ): Observable<ResponseTableModel<ProyectoTableModel>> {
    return this.http.post<ResponseTableModel<ProyectoTableModel>>(
      `${this.api}proyectos/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<ProyectoTableModel>> {
    return this.http.get<ResponseModel<ProyectoTableModel>>(
      `${this.api}proyectos/${id}`,
    );
  }

  create(
    dto: CreateProyectoDto,
  ): Observable<ResponseModel<ProyectoTableModel>> {
    return this.http.post<ResponseModel<ProyectoTableModel>>(
      `${this.api}proyectos`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProyectoDto,
  ): Observable<ResponseModel<ProyectoTableModel>> {
    return this.http.put<ResponseModel<ProyectoTableModel>>(
      `${this.api}proyectos/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(
      `${this.api}proyectos/${id}`,
    );
  }

  list(): Observable<ResponseModel<ProyectoDto[]>> {
    return this.http.get<ResponseModel<ProyectoDto[]>>(
      `${this.api}proyectos/list`,
    );
  }

  // ── Frentes ────────────────────────────────────────────────
  frentes(proyectoId: number): Observable<ResponseModel<FrenteTableModel[]>> {
    return this.http.get<ResponseModel<FrenteTableModel[]>>(
      `${this.api}proyectos/${proyectoId}/frentes`,
    );
  }

  crearFrente(
    proyectoId: number,
    dto: CreateFrenteDto,
  ): Observable<ResponseModel<FrenteTableModel>> {
    return this.http.post<ResponseModel<FrenteTableModel>>(
      `${this.api}proyectos/${proyectoId}/frentes`,
      dto,
    );
  }

  actualizarFrente(
    id: number,
    dto: UpdateFrenteDto,
  ): Observable<ResponseModel<FrenteTableModel>> {
    return this.http.put<ResponseModel<FrenteTableModel>>(
      `${this.api}frentes/${id}`,
      dto,
    );
  }

  eliminarFrente(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}frentes/${id}`);
  }

  // ── Trabajadores del frente ────────────────────────────────
  trabajadores(
    frenteId: number,
  ): Observable<ResponseModel<FrenteTrabajadorModel[]>> {
    return this.http.get<ResponseModel<FrenteTrabajadorModel[]>>(
      `${this.api}frentes/${frenteId}/trabajadores`,
    );
  }

  asignarTrabajador(
    frenteId: number,
    dto: AsignarTrabajadorDto,
  ): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}frentes/${frenteId}/trabajadores`,
      dto,
    );
  }

  retirarTrabajador(
    frenteId: number,
    empleadoId: number,
  ): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(
      `${this.api}frentes/${frenteId}/trabajadores/${empleadoId}`,
    );
  }

  // ── Turno del frente (vigencias) ───────────────────────────
  frenteTurnos(frenteId: number): Observable<ResponseModel<FrenteTurnoModel[]>> {
    return this.http.get<ResponseModel<FrenteTurnoModel[]>>(
      `${this.api}frentes/${frenteId}/turnos`,
    );
  }

  asignarFrenteTurno(
    frenteId: number,
    dto: AsignarFrenteTurnoDto,
  ): Observable<ResponseModel<FrenteTurnoModel>> {
    return this.http.post<ResponseModel<FrenteTurnoModel>>(
      `${this.api}frentes/${frenteId}/turnos`,
      dto,
    );
  }

  eliminarFrenteTurno(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}frentes/turnos/${id}`);
  }

  // ── Empleados (para pickers de líder y trabajadores) ───────
  // Solo empleados con contrato ACTIVO: no se asigna a un frente a quien ya no
  // tiene contrato.
  empleados(): Observable<ResponseModel<EmpleadoModel[]>> {
    return this.http.get<ResponseModel<EmpleadoModel[]>>(
      `${this.api}empleados/con-contrato-activo`,
    );
  }

  // ── Asistencia por frente (Fase B) ─────────────────────────
  obtenerAsistencia(
    frenteId: number,
    fecha: string,
  ): Observable<ResponseModel<AsistenciaFrenteModel>> {
    return this.http.get<ResponseModel<AsistenciaFrenteModel>>(
      `${this.api}asistencia/frentes/${frenteId}/fecha/${fecha}`,
    );
  }

  guardarBorrador(
    frenteId: number,
    dto: GuardarBorradorDto,
  ): Observable<ResponseModel<AsistenciaFrenteModel>> {
    return this.http.post<ResponseModel<AsistenciaFrenteModel>>(
      `${this.api}asistencia/frentes/${frenteId}/borrador`,
      dto,
    );
  }

  subirSoporte(
    frenteId: number,
    fecha: string,
    file: File,
  ): Observable<ResponseModel<AsistenciaFrenteModel>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ResponseModel<AsistenciaFrenteModel>>(
      `${this.api}asistencia/frentes/${frenteId}/soporte-pdf?fecha=${fecha}`,
      fd,
    );
  }

  /** Asistencia del frente en el mes por trabajador y día. mes = AAAA-MM. */
  calendarioAsistencia(frenteId: number, mes: string): Observable<ResponseModel<CalendarioMesModel>> {
    return this.http.get<ResponseModel<CalendarioMesModel>>(
      `${this.api}asistencia/frentes/${frenteId}/calendario?mes=${mes}`,
    );
  }

  // ── Marcaje del mes desde Excel (V242) ─────────────────────
  /** Valida las filas de la plantilla y clasifica las horas, sin guardar. */
  validarMarcajeExcel(frenteId: number, filas: FilaMarcajeDto[]): Observable<ResponseModel<ResultadoMarcajeModel>> {
    return this.http.post<ResponseModel<ResultadoMarcajeModel>>(
      `${this.api}asistencia/frentes/${frenteId}/excel/validar`,
      { filas },
    );
  }

  /** Importa el marcaje (todo o nada); el archivo queda como soporte de cada día. */
  confirmarMarcajeExcel(
    frenteId: number,
    filas: FilaMarcajeDto[],
    archivo: File | null,
  ): Observable<ResponseModel<ResultadoMarcajeModel>> {
    const fd = new FormData();
    fd.append('datos', new Blob([JSON.stringify({ filas })], { type: 'application/json' }));
    if (archivo) fd.append('archivo', archivo);
    return this.http.post<ResponseModel<ResultadoMarcajeModel>>(
      `${this.api}asistencia/frentes/${frenteId}/excel/confirmar`,
      fd,
    );
  }

  /** Envía a revisión todos los días en borrador del frente en el rango. */
  enviarRevisionRango(frenteId: number, desde: string, hasta: string): Observable<ResponseModel<ResultadoRangoModel>> {
    return this.http.post<ResponseModel<ResultadoRangoModel>>(
      `${this.api}asistencia/frentes/${frenteId}/enviar-revision-rango`,
      { desde, hasta },
    );
  }

  /** Aprueba (y envía a nómina) todos los días en revisión del frente en el rango. */
  aprobarRango(
    frenteId: number,
    desde: string,
    hasta: string,
    enviarNomina = true,
  ): Observable<ResponseModel<ResultadoRangoModel>> {
    return this.http.post<ResponseModel<ResultadoRangoModel>>(
      `${this.api}asistencia/frente-revision/frente/${frenteId}/aprobar-rango`,
      { desde, hasta, enviarNomina },
    );
  }

  enviarRevision(asistenciaId: number): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}asistencia/frentes/${asistenciaId}/enviar-revision`,
      {},
    );
  }

  // ── Revisión / aprobación (Fase D) ─────────────────────────
  revisionPage(
    dto: RevisionFilterDto,
  ): Observable<ResponseTableModel<RevisionTableModel>> {
    return this.http.post<ResponseTableModel<RevisionTableModel>>(
      `${this.api}asistencia/frente-revision/page`,
      dto,
    );
  }

  getRevision(id: number): Observable<ResponseModel<AsistenciaFrenteModel>> {
    return this.http.get<ResponseModel<AsistenciaFrenteModel>>(
      `${this.api}asistencia/frente-revision/${id}`,
    );
  }

  revisarDetalles(
    id: number,
    detalles: RevisarDetalleItem[],
  ): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}asistencia/frente-revision/${id}/detalles`,
      { detalles },
    );
  }

  aprobarRevision(
    id: number,
    observacion?: string,
  ): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}asistencia/frente-revision/${id}/aprobar`,
      { observacion: observacion ?? null },
    );
  }

  rechazarRevision(
    id: number,
    observacion?: string,
  ): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}asistencia/frente-revision/${id}/rechazar`,
      { observacion: observacion ?? null },
    );
  }

  solicitarCorreccion(
    id: number,
    observacion?: string,
  ): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}asistencia/frente-revision/${id}/solicitar-correccion`,
      { observacion: observacion ?? null },
    );
  }

  enviarNomina(id: number): Observable<ResponseModel<number>> {
    return this.http.post<ResponseModel<number>>(
      `${this.api}asistencia/frente-revision/${id}/enviar-nomina`,
      {},
    );
  }

  preliquidacionFrente(
    periodoId: number,
    proyectoId?: number | null,
    frenteId?: number | null,
  ): Observable<ResponseModel<PreliquidacionFrenteItem[]>> {
    let url = `${this.api}asistencia/frente-revision/preliquidacion?periodoId=${periodoId}`;
    if (proyectoId) url += `&proyectoId=${proyectoId}`;
    if (frenteId) url += `&frenteId=${frenteId}`;
    return this.http.get<ResponseModel<PreliquidacionFrenteItem[]>>(url);
  }
}
