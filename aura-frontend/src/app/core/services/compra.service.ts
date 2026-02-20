import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CompraModel,
  CompraTableModel,
  CreateCompraDto,
  CompraPageableDto,
} from '../models/compra.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly apiUrl = `${environment.apiUrl}compras`;
  constructor(private readonly http: HttpClient) {}

  page(
    dto: CompraPageableDto,
  ): Observable<ResponseTableModel<CompraTableModel>> {
    return this.http.post<ResponseTableModel<CompraTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<CompraModel>> {
    return this.http.get<ResponseModel<CompraModel>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCompraDto): Observable<ResponseModel<CompraModel>> {
    return this.http.post<ResponseModel<CompraModel>>(
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
