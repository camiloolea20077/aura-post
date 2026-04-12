import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  TarifaRetencionModel,
  CreateTarifaRetencionDto,
  RetencionesSugeridasModel,
} from '../models/tarifa-retencion.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { ResponseTableModel } from '../../shared/utils/response-table.model';

@Injectable({ providedIn: 'root' })
export class TarifaRetencionService {
  private readonly apiUrl = `${environment.apiUrl}tarifas-retencion`;

  constructor(private readonly http: HttpClient) {}

  page(dto: { page: number; rows: number; search?: string }): Observable<ResponseTableModel<TarifaRetencionModel>> {
    return this.http.post<ResponseTableModel<TarifaRetencionModel>>(`${this.apiUrl}/page`, dto);
  }

  todas(): Observable<ResponseModel<TarifaRetencionModel[]>> {
    return this.http.get<ResponseModel<TarifaRetencionModel[]>>(`${this.apiUrl}/todas`);
  }

  create(dto: CreateTarifaRetencionDto): Observable<ResponseModel<TarifaRetencionModel>> {
    return this.http.post<ResponseModel<TarifaRetencionModel>>(this.apiUrl, dto);
  }

  update(id: number, dto: CreateTarifaRetencionDto): Observable<ResponseModel<TarifaRetencionModel>> {
    return this.http.put<ResponseModel<TarifaRetencionModel>>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }

  sugeridas(terceroId: number): Observable<ResponseModel<RetencionesSugeridasModel>> {
    return this.http.get<ResponseModel<RetencionesSugeridasModel>>(
      `${this.apiUrl}/sugeridas`,
      { params: { terceroId: terceroId.toString() } },
    );
  }
}
