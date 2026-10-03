import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivoFijoModel,
  ActivoFijoTableModel,
  CreateActivoFijoDto,
  DepreciacionPeriodoModel,
  AdicionActivoModel,
  MantenimientoActivoModel,
  ProyeccionDepreciacionModel,
  ReporteActivosModel,
  RetiroActivoDto,
} from '../models/activo-fijo.model';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ActivoFijoService {
  private readonly api = `${environment.apiUrl}activos-fijos`;

  constructor(private readonly http: HttpClient) {}

  listar(body: object): Observable<ResponseTableModel<ActivoFijoTableModel>> {
    return this.http.post<ResponseTableModel<ActivoFijoTableModel>>(
      `${this.api}/page`,
      body,
    );
  }

  getById(id: number): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.get<ResponseModel<ActivoFijoModel>>(`${this.api}/${id}`);
  }

  create(dto: CreateActivoFijoDto): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.post<ResponseModel<ActivoFijoModel>>(this.api, dto);
  }

  update(
    id: number,
    dto: CreateActivoFijoDto,
  ): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.put<ResponseModel<ActivoFijoModel>>(
      `${this.api}/${id}`,
      dto,
    );
  }

  /** Baja con asiento: DB depreciación acumulada y pérdida · CR costo del activo. */
  darDeBaja(id: number, dto: RetiroActivoDto): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.put<ResponseModel<ActivoFijoModel>>(`${this.api}/${id}/dar-de-baja`, dto);
  }

  vender(id: number, dto: RetiroActivoDto): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.put<ResponseModel<ActivoFijoModel>>(`${this.api}/${id}/vender`, dto);
  }

  anularRetiro(id: number): Observable<ResponseModel<ActivoFijoModel>> {
    return this.http.put<ResponseModel<ActivoFijoModel>>(`${this.api}/${id}/anular-retiro`, {});
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/${id}`);
  }

  /** unidades: uso del mes por activo, solo para los de unidades de producción. */
  calcularDepreciacion(
    periodoId: number,
    unidades?: Record<number, number>,
  ): Observable<ResponseModel<DepreciacionPeriodoModel[]>> {
    return this.http.post<ResponseModel<DepreciacionPeriodoModel[]>>(
      `${this.api}/depreciar/${periodoId}`,
      unidades ? { unidades } : {},
    );
  }

  reversarDepreciacion(periodoId: number): Observable<ResponseModel<number>> {
    return this.http.post<ResponseModel<number>>(`${this.api}/depreciar/${periodoId}/reversar`, {});
  }

  proyeccion(id: number): Observable<ResponseModel<ProyeccionDepreciacionModel[]>> {
    return this.http.get<ResponseModel<ProyeccionDepreciacionModel[]>>(`${this.api}/${id}/proyeccion`);
  }

  adiciones(id: number): Observable<ResponseModel<AdicionActivoModel[]>> {
    return this.http.get<ResponseModel<AdicionActivoModel[]>>(`${this.api}/${id}/adiciones`);
  }

  registrarAdicion(id: number, dto: AdicionActivoModel): Observable<ResponseModel<AdicionActivoModel>> {
    return this.http.post<ResponseModel<AdicionActivoModel>>(`${this.api}/${id}/adiciones`, dto);
  }

  mantenimientos(id: number): Observable<ResponseModel<MantenimientoActivoModel[]>> {
    return this.http.get<ResponseModel<MantenimientoActivoModel[]>>(`${this.api}/${id}/mantenimientos`);
  }

  registrarMantenimiento(
    id: number,
    dto: MantenimientoActivoModel,
  ): Observable<ResponseModel<MantenimientoActivoModel>> {
    return this.http.post<ResponseModel<MantenimientoActivoModel>>(`${this.api}/${id}/mantenimientos`, dto);
  }

  eliminarMantenimiento(id: number, mantenimientoId: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/${id}/mantenimientos/${mantenimientoId}`);
  }

  reporte(filtros: {
    estado?: string | null;
    categoria?: string | null;
    centroCostoId?: number | null;
    periodoId?: number | null;
    agrupar?: string | null;
  }): Observable<ResponseModel<ReporteActivosModel>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ResponseModel<ReporteActivosModel>>(`${this.api}/reporte`, { params });
  }

  historialDepreciacion(
    activoId: number,
  ): Observable<ResponseModel<DepreciacionPeriodoModel[]>> {
    return this.http.get<ResponseModel<DepreciacionPeriodoModel[]>>(
      `${this.api}/${activoId}/historial-depreciacion`,
    );
  }
}
