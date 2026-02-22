import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SucursalDto,
  SucursalModel,
  SucursalTableModel,
  CreateSucursalDto,
  UpdateSucursalDto,
  SucursalFilterParams,
  SucursalPageableDto,
} from '../models/sucursal.model';
import { environment } from '../../../environments/environment';
import { IFilterTable } from '../../shared/utils/filter-table';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private readonly apiUrl = `${environment.apiUrl}sucursales`;

  constructor(private readonly http: HttpClient) {}

  // ─── Paginado (tabla lazy) ────────────────────────────────
  page(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<SucursalTableModel>> {
    return this.http.post<ResponseTableModel<SucursalTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  // ─── Por ID ───────────────────────────────────────────────
  getById(id: number): Observable<ResponseModel<SucursalModel>> {
    return this.http.get<ResponseModel<SucursalModel>>(`${this.apiUrl}/${id}`);
  }

  // ─── Lista simple (para dropdowns) ────────────────────────
  getActivas(): Observable<ResponseModel<SucursalDto[]>> {
    return this.http.get<ResponseModel<SucursalDto[]>>(
      `${this.apiUrl}/activas`,
    );
  }

  // ─── Crear ────────────────────────────────────────────────
  create(dto: CreateSucursalDto): Observable<ResponseModel<SucursalModel>> {
    return this.http.post<ResponseModel<SucursalModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  // ─── Actualizar ───────────────────────────────────────────
  update(
    id: number,
    dto: UpdateSucursalDto,
  ): Observable<ResponseModel<SucursalModel>> {
    return this.http.put<ResponseModel<SucursalModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  // ─── Eliminar ─────────────────────────────────────────────
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
