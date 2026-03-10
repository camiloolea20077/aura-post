import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ComisionConfigModel,
  ComisionConfigTableModel,
  ComisionLiquidacionModel,
  ComisionLiquidacionTableModel,
  ComisionVentaModel,
  CreateComisionConfigDto,
  UpdateComisionConfigDto,
  ComisionConfigPageableDto,
  CreateLiquidacionDto,
  LiquidacionPageableDto,
  ReporteTecnicoItem,
  TecnicoDto,
} from '../models/comision.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ComisionService {
  private readonly baseUrl = `${environment.apiUrl}comisiones`;

  constructor(private readonly http: HttpClient) {}

  // ─── Técnicos disponibles (usuarios de la empresa) ────────
  listTecnicos(): Observable<ResponseModel<TecnicoDto[]>> {
    return this.http.get<ResponseModel<TecnicoDto[]>>(
      `${this.baseUrl}/tecnicos`,
    );
  }

  // ─── Configuración ────────────────────────────────────────
  pageConfig(
    filter: ComisionConfigPageableDto,
  ): Observable<ResponseTableModel<ComisionConfigTableModel>> {
    return this.http.post<ResponseTableModel<ComisionConfigTableModel>>(
      `${this.baseUrl}/config/page`,
      filter,
    );
  }

  getConfigById(id: number): Observable<ResponseModel<ComisionConfigModel>> {
    return this.http.get<ResponseModel<ComisionConfigModel>>(
      `${this.baseUrl}/config/${id}`,
    );
  }

  createConfig(
    dto: CreateComisionConfigDto,
  ): Observable<ResponseModel<ComisionConfigModel>> {
    return this.http.post<ResponseModel<ComisionConfigModel>>(
      `${this.baseUrl}/config/create`,
      dto,
    );
  }

  updateConfig(
    id: number,
    dto: UpdateComisionConfigDto,
  ): Observable<ResponseModel<ComisionConfigModel>> {
    return this.http.put<ResponseModel<ComisionConfigModel>>(
      `${this.baseUrl}/config/${id}`,
      dto,
    );
  }

  toggleConfig(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(
      `${this.baseUrl}/config/${id}/toggle`,
      {},
    );
  }

  // ─── Liquidaciones ────────────────────────────────────────
  pageLiquidaciones(
    filter: LiquidacionPageableDto,
  ): Observable<ResponseTableModel<ComisionLiquidacionTableModel>> {
    return this.http.post<ResponseTableModel<ComisionLiquidacionTableModel>>(
      `${this.baseUrl}/liquidaciones/page`,
      filter,
    );
  }

  getLiquidacionById(
    id: number,
  ): Observable<ResponseModel<ComisionLiquidacionModel>> {
    return this.http.get<ResponseModel<ComisionLiquidacionModel>>(
      `${this.baseUrl}/liquidaciones/${id}`,
    );
  }

  createLiquidacion(
    dto: CreateLiquidacionDto,
  ): Observable<ResponseModel<ComisionLiquidacionModel>> {
    return this.http.post<ResponseModel<ComisionLiquidacionModel>>(
      `${this.baseUrl}/liquidaciones/create`,
      dto,
    );
  }

  marcarPagada(id: number, fechaPago: string): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(
      `${this.baseUrl}/liquidaciones/${id}/pagar`,
      { fechaPago },
    );
  }

  // ─── Reporte resumen por técnico ──────────────────────────
  getReporteTecnicos(): Observable<ResponseModel<ReporteTecnicoItem[]>> {
    return this.http.get<ResponseModel<ReporteTecnicoItem[]>>(
      `${this.baseUrl}/reporte/tecnico`,
    );
  }

  // ─── Comisiones pendientes (para crear liquidación) ───────
  getVentasPendientes(
    tecnicoId: number,
  ): Observable<ResponseModel<ComisionVentaModel[]>> {
    return this.http.get<ResponseModel<ComisionVentaModel[]>>(
      `${this.baseUrl}/pendientes?tecnicoId=${tecnicoId}`,
    );
  }
}
