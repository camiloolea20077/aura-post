import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  VentaModel,
  VentaTableModel,
  CreateVentaDto,
  VentaPageableDto,
} from '../models/venta.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly apiUrl = `${environment.apiUrl}ventas`;
  constructor(private readonly http: HttpClient) {}

  page(dto: VentaPageableDto): Observable<ResponseTableModel<VentaTableModel>> {
    return this.http.post<ResponseTableModel<VentaTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<VentaModel>> {
    return this.http.get<ResponseModel<VentaModel>>(`${this.apiUrl}/${id}`);
  }
  create(dto: CreateVentaDto): Observable<ResponseModel<VentaModel>> {
    return this.http.post<ResponseModel<VentaModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  anular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(
      `${this.apiUrl}/${id}/anular`,
      {},
    );
  }
}
