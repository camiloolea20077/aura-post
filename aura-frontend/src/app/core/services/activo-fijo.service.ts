import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivoFijoModel,
  ActivoFijoTableModel,
  CreateActivoFijoDto,
  DepreciacionPeriodoModel,
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

  darDeBaja(
    id: number,
    observaciones?: string,
  ): Observable<ResponseModel<ActivoFijoModel>> {
    const params = observaciones
      ? `?observaciones=${encodeURIComponent(observaciones)}`
      : '';
    return this.http.put<ResponseModel<ActivoFijoModel>>(
      `${this.api}/${id}/dar-de-baja${params}`,
      {},
    );
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/${id}`);
  }

  calcularDepreciacion(
    periodoId: number,
  ): Observable<ResponseModel<DepreciacionPeriodoModel[]>> {
    return this.http.post<ResponseModel<DepreciacionPeriodoModel[]>>(
      `${this.api}/depreciar/${periodoId}`,
      {},
    );
  }

  historialDepreciacion(
    activoId: number,
  ): Observable<ResponseModel<DepreciacionPeriodoModel[]>> {
    return this.http.get<ResponseModel<DepreciacionPeriodoModel[]>>(
      `${this.api}/${activoId}/historial-depreciacion`,
    );
  }
}
