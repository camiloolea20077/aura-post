import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  UnidadMedidaModel,
  UnidadMedidaTableModel,
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
  UnidadMedidaFilterParams,
} from '../models/unidad-medida.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { IFilterTable } from '../../shared/utils/filter-table';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class UnidadMedidaService {
  private readonly apiUrl = `${environment.apiUrl}unidades-medida`;

  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<UnidadMedidaFilterParams>,
  ): Observable<ResponseTableModel<UnidadMedidaTableModel>> {
    return this.http.post<ResponseTableModel<UnidadMedidaTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  getById(id: number): Observable<ResponseModel<UnidadMedidaModel>> {
    return this.http.get<ResponseModel<UnidadMedidaModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  list(): Observable<ResponseModel<UnidadMedidaTableModel[]>> {
    return this.http.get<ResponseModel<UnidadMedidaTableModel[]>>(
      `${this.apiUrl}/list`,
    );
  }

  create(
    dto: CreateUnidadMedidaDto,
  ): Observable<ResponseModel<UnidadMedidaModel>> {
    return this.http.post<ResponseModel<UnidadMedidaModel>>(this.apiUrl, dto);
  }

  update(
    id: number,
    dto: UpdateUnidadMedidaDto,
  ): Observable<ResponseModel<UnidadMedidaModel>> {
    return this.http.put<ResponseModel<UnidadMedidaModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
