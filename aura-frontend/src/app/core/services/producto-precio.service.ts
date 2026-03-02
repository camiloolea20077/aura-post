import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ProductoPrecioModel,
  ProductoPrecioTableModel,
  CreateProductoPrecioDto,
  UpdateProductoPrecioDto,
  ProductoPrecioPageableDto,
} from '../models/producto-precio.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import { IFilterTable } from '../../shared/utils/filter-table';

@Injectable({ providedIn: 'root' })
export class ProductoPrecioService {
  private readonly apiUrl = `${environment.apiUrl}productos/precios`;

  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<ProductoPrecioTableModel>> {
    return this.http.post<ResponseTableModel<ProductoPrecioTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  getById(id: number): Observable<ResponseModel<ProductoPrecioModel>> {
    return this.http.get<ResponseModel<ProductoPrecioModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  // Precios de una lista específica (para vista detalle de lista)
  listByLista(
    listaPrecioId: number,
  ): Observable<ResponseModel<ProductoPrecioTableModel[]>> {
    return this.http.get<ResponseModel<ProductoPrecioTableModel[]>>(
      `${this.apiUrl}/lista/${listaPrecioId}`,
    );
  }

  create(
    dto: CreateProductoPrecioDto,
  ): Observable<ResponseModel<ProductoPrecioModel>> {
    return this.http.post<ResponseModel<ProductoPrecioModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProductoPrecioDto,
  ): Observable<ResponseModel<ProductoPrecioModel>> {
    return this.http.put<ResponseModel<ProductoPrecioModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
