import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductoModel,
  ProductoTableModel,
  CreateProductoDto,
  UpdateProductoDto,
  PageableDto,
} from '../models/producto.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}productos`;

  constructor(private readonly http: HttpClient) {}

  // ─── Paginado via POST body (como el backend) ─────────────
  page(dto: PageableDto): Observable<ResponseTableModel<ProductoTableModel>> {
    return this.http.post<ResponseTableModel<ProductoTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  // ─── Detalle por ID ───────────────────────────────────────
  getById(id: number): Observable<ResponseModel<ProductoModel>> {
    return this.http.get<ResponseModel<ProductoModel>>(`${this.apiUrl}/${id}`);
  }

  // ─── Lista simple para dropdowns ─────────────────────────
  list(): Observable<ResponseModel<ProductoTableModel[]>> {
    return this.http.get<ResponseModel<ProductoTableModel[]>>(
      `${this.apiUrl}/list`,
    );
  }

  // ─── CRUD ─────────────────────────────────────────────────
  create(dto: CreateProductoDto): Observable<ResponseModel<ProductoModel>> {
    return this.http.post<ResponseModel<ProductoModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProductoDto,
  ): Observable<ResponseModel<ProductoModel>> {
    return this.http.put<ResponseModel<ProductoModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
  actualizarCodigoBarras(
    id: number,
    dto: { codigoBarras: string },
  ): Observable<ResponseModel<any>> {
    return this.http.patch<ResponseModel<any>>(
      `${this.apiUrl}/${id}/codigo-barras`,
      dto,
    );
  }
}
