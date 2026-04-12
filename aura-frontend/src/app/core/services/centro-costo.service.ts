import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import {
  CentroCostoDto,
  CentroCostoTableModel,
  CentroCostoPageableDto,
  CreateCentroCostoDto,
  UpdateCentroCostoDto,
} from '../models/centro-costo.model';

@Injectable({ providedIn: 'root' })
export class CentroCostoService {
  private readonly baseUrl = `${environment.apiUrl}centros-costos`;

  constructor(private readonly http: HttpClient) {}

  page(
    filter: CentroCostoPageableDto,
  ): Observable<ResponseTableModel<CentroCostoTableModel>> {
    return this.http.post<ResponseTableModel<CentroCostoTableModel>>(
      `${this.baseUrl}/page`,
      filter,
    );
  }

  getById(id: number): Observable<ResponseModel<CentroCostoTableModel>> {
    return this.http.get<ResponseModel<CentroCostoTableModel>>(
      `${this.baseUrl}/${id}`,
    );
  }

  create(
    dto: CreateCentroCostoDto,
  ): Observable<ResponseModel<CentroCostoTableModel>> {
    return this.http.post<ResponseModel<CentroCostoTableModel>>(
      this.baseUrl,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateCentroCostoDto,
  ): Observable<ResponseModel<CentroCostoTableModel>> {
    return this.http.put<ResponseModel<CentroCostoTableModel>>(
      `${this.baseUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(
      `${this.baseUrl}/${id}`,
    );
  }

  /** Lista plana para dropdowns y selects */
  list(): Observable<ResponseModel<CentroCostoDto[]>> {
    return this.http.get<ResponseModel<CentroCostoDto[]>>(
      `${this.baseUrl}/list`,
    );
  }
}
