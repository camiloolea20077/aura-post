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
import { EmpleadoTableModel, NominaPageableDto } from '../models/nomina.model';
import {
  AsistenciaFrenteModel,
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
  empleados(
    search?: string,
  ): Observable<ResponseTableModel<EmpleadoTableModel>> {
    const dto: NominaPageableDto = {
      page: 0,
      rows: 100,
      search: search ?? null,
    };
    return this.http.post<ResponseTableModel<EmpleadoTableModel>>(
      `${this.api}empleados/page`,
      dto,
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
