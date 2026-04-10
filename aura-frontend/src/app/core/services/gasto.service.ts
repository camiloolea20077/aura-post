import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateGastoDto,
  GastoModel,
  GastoTableModel,
} from '../models/gasto.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

interface PageableBody {
  page: number;
  rows: number;
  search?: string;
  order_by?: string;
  order?: string;
}

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly apiUrl = `${environment.apiUrl}gastos`;

  constructor(private readonly http: HttpClient) {}

  page(body: PageableBody): Observable<ResponseTableModel<GastoTableModel>> {
    return this.http.post<ResponseTableModel<GastoTableModel>>(
      `${this.apiUrl}/page`,
      body,
    );
  }

  create(dto: CreateGastoDto): Observable<ResponseModel<GastoModel>> {
    return this.http.post<ResponseModel<GastoModel>>(this.apiUrl, dto);
  }

  update(
    id: number,
    dto: CreateGastoDto,
  ): Observable<ResponseModel<GastoModel>> {
    return this.http.put<ResponseModel<GastoModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<GastoModel>> {
    return this.http.get<ResponseModel<GastoModel>>(`${this.apiUrl}/${id}`);
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
