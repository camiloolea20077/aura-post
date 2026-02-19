import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductoPresentacionModel,
  ProductoPresentacionTableModel,
  CreateProductoPresentacionDto,
  UpdateProductoPresentacionDto,
  PresentacionPageableDto,
} from '../models/producto-presentacion.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ProductoPresentacionService {
  private readonly apiUrl = `${environment.apiUrl}productos/presentaciones`;

  constructor(private readonly http: HttpClient) {}

  page(
    dto: PresentacionPageableDto,
  ): Observable<ResponseTableModel<ProductoPresentacionTableModel>> {
    return this.http.post<ResponseTableModel<ProductoPresentacionTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<ProductoPresentacionModel>> {
    return this.http.get<ResponseModel<ProductoPresentacionModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  // Lista por producto (para dropdown en precios/composición)
  listByProducto(
    productoId: number,
  ): Observable<ResponseModel<ProductoPresentacionTableModel[]>> {
    return this.http.get<ResponseModel<ProductoPresentacionTableModel[]>>(
      `${this.apiUrl}/producto/${productoId}`,
    );
  }

  create(
    dto: CreateProductoPresentacionDto,
  ): Observable<ResponseModel<ProductoPresentacionModel>> {
    return this.http.post<ResponseModel<ProductoPresentacionModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProductoPresentacionDto,
  ): Observable<ResponseModel<ProductoPresentacionModel>> {
    return this.http.put<ResponseModel<ProductoPresentacionModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
