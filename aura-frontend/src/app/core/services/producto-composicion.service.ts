import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductoComposicionModel,
  ProductoComposicionTableModel,
  CreateProductoComposicionDto,
  UpdateProductoComposicionDto,
  ComposicionPageableDto,
  RecetaModel,
  RecetaResumenTableModel,
  RecetaCosteoModel,
  GuardarRecetaDto,
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

  // ─── Receta completa ───────────────────────────────────────
  /** Una fila por producto con receta, en vez de una por ingrediente. */
  pageRecetas(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<RecetaResumenTableModel>> {
    return this.http.post<ResponseTableModel<RecetaResumenTableModel>>(
      `${this.apiUrl}/recetas/page`,
      filter,
    );
  }

  getReceta(productoPadreId: number): Observable<ResponseModel<RecetaModel>> {
    return this.http.get<ResponseModel<RecetaModel>>(
      `${this.apiUrl}/receta/${productoPadreId}`,
    );
  }

  /** Guarda la receta entera en un solo request. Reemplaza todas las líneas. */
  guardarReceta(
    productoPadreId: number,
    dto: GuardarRecetaDto,
  ): Observable<ResponseModel<RecetaModel>> {
    return this.http.put<ResponseModel<RecetaModel>>(
      `${this.apiUrl}/receta/${productoPadreId}`,
      dto,
    );
  }

  duplicarReceta(
    productoDestinoId: number,
    productoOrigenId: number,
  ): Observable<ResponseModel<RecetaModel>> {
    return this.http.post<ResponseModel<RecetaModel>>(
      `${this.apiUrl}/receta/${productoDestinoId}/duplicar-de/${productoOrigenId}`,
      {},
    );
  }

  // ─── Costeo ────────────────────────────────────────────────
  costear(
    productoPadreId: number,
  ): Observable<ResponseModel<RecetaCosteoModel>> {
    return this.http.get<ResponseModel<RecetaCosteoModel>>(
      `${this.apiUrl}/receta/${productoPadreId}/costeo`,
    );
  }

  aplicarCosto(
    productoPadreId: number,
  ): Observable<ResponseModel<RecetaCosteoModel>> {
    return this.http.post<ResponseModel<RecetaCosteoModel>>(
      `${this.apiUrl}/receta/${productoPadreId}/aplicar-costo`,
      {},
    );
  }
}
