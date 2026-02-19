import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductoComposicionModel,
  ProductoComposicionTableModel,
  CreateProductoComposicionDto,
  UpdateProductoComposicionDto,
  ComposicionPageableDto,
} from '../models/producto-composicion.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import { IFilterTable } from '../../shared/utils/filter-table';

@Injectable({ providedIn: 'root' })
export class ProductoComposicionService {
  private readonly apiUrl = `${environment.apiUrl}productos/composicion`;

  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<ProductoComposicionTableModel>> {
    return this.http.post<ResponseTableModel<ProductoComposicionTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  getById(id: number): Observable<ResponseModel<ProductoComposicionModel>> {
    return this.http.get<ResponseModel<ProductoComposicionModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  // Lista de componentes de un producto padre
  listByPadre(
    productoPadreId: number,
  ): Observable<ResponseModel<ProductoComposicionTableModel[]>> {
    return this.http.get<ResponseModel<ProductoComposicionTableModel[]>>(
      `${this.apiUrl}/padre/${productoPadreId}`,
    );
  }

  create(
    dto: CreateProductoComposicionDto,
  ): Observable<ResponseModel<ProductoComposicionModel>> {
    return this.http.post<ResponseModel<ProductoComposicionModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProductoComposicionDto,
  ): Observable<ResponseModel<ProductoComposicionModel>> {
    return this.http.put<ResponseModel<ProductoComposicionModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
