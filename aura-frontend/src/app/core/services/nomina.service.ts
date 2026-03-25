import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AddNovedadDto,
  CreateEmpleadoDto,
  CreatePeriodoDto,
  EmpleadoModel,
  EmpleadoTableModel,
  NominaConfigModel,
  NominaModel,
  NominaPageableDto,
  NominaTableModel,
  PeriodoNominaModel,
  UpdateNominaConfigDto,
} from '../models/nomina.model';
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

  createEmpleado(
    dto: CreateEmpleadoDto,
  ): Observable<ResponseModel<EmpleadoModel>> {
    return this.http.post<ResponseModel<EmpleadoModel>>(
      `${this.base}empleados/create`,
      dto,
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

  liquidar(
    periodoId: number,
    empleadoId: number,
  ): Observable<ResponseModel<NominaModel>> {
    return this.http.post<ResponseModel<NominaModel>>(
      `${this.base}nomina/liquidar/${periodoId}/empleado/${empleadoId}`,
      {},
    );
  }

  liquidarTodos(periodoId: number): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(
      `${this.base}nomina/liquidar/${periodoId}/todos`,
      {},
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
