import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  InventarioModel,
  InventarioTableModel,
  CreateInventarioDto,
  UpdateInventarioDto,
  InventarioPageableDto,
} from '../models/inventario.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly apiUrl = `${environment.apiUrl}inventario`;
  constructor(private readonly http: HttpClient) {}

  page(
    dto: InventarioPageableDto,
  ): Observable<ResponseTableModel<InventarioTableModel>> {
    return this.http.post<ResponseTableModel<InventarioTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<InventarioModel>> {
    return this.http.get<ResponseModel<InventarioModel>>(
      `${this.apiUrl}/${id}`,
    );
  }
  stockBajo(): Observable<ResponseModel<InventarioTableModel[]>> {
    return this.http.get<ResponseModel<InventarioTableModel[]>>(
      `${this.apiUrl}/stock-bajo`,
    );
  }
  create(dto: CreateInventarioDto): Observable<ResponseModel<InventarioModel>> {
    return this.http.post<ResponseModel<InventarioModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  update(
    id: number,
    dto: UpdateInventarioDto,
  ): Observable<ResponseModel<InventarioModel>> {
    return this.http.put<ResponseModel<InventarioModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }
}
