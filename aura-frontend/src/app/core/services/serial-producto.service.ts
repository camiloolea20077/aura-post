import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SerialProductoModel,
  SerialProductoTableModel,
  CreateSerialProductoDto,
  SerialPageableDto,
} from '../models/serial-producto.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import { IFilterTable } from '../../shared/utils/filter-table';

@Injectable({ providedIn: 'root' })
export class SerialProductoService {
  private readonly apiUrl = `${environment.apiUrl}seriales`;
  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<SerialProductoTableModel>> {
    return this.http.post<ResponseTableModel<SerialProductoTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }
  getById(id: number): Observable<ResponseModel<SerialProductoModel>> {
    return this.http.get<ResponseModel<SerialProductoModel>>(
      `${this.apiUrl}/${id}`,
    );
  }
  create(
    dto: CreateSerialProductoDto,
  ): Observable<ResponseModel<SerialProductoModel>> {
    return this.http.post<ResponseModel<SerialProductoModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
