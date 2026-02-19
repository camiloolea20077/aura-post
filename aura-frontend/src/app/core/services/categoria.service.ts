import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CategoriaDto,
  CategoriaModel,
  CategoriaTableModel,
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from '../models/categoria.model';
import { CategoriaFilterParams } from '../models/categoria.model';
import { environment } from '../../../environments/environment';
import { IFilterTable } from '../../shared/utils/filter-table';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly apiUrl = `${environment.apiUrl}categorias`;

  constructor(private readonly http: HttpClient) {}

  // ─── Paginado (tabla lazy) ────────────────────────────────
  page(
    filter: IFilterTable<CategoriaFilterParams>,
  ): Observable<ResponseTableModel<CategoriaTableModel>> {
    return this.http.post<ResponseTableModel<CategoriaTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  // ─── Por ID ───────────────────────────────────────────────
  getById(id: number): Observable<ResponseModel<CategoriaModel>> {
    return this.http.get<ResponseModel<CategoriaModel>>(`${this.apiUrl}/${id}`);
  }

  // ─── Lista simple (para dropdowns) ────────────────────────
  list(): Observable<ResponseModel<CategoriaDto[]>> {
    return this.http.get<ResponseModel<CategoriaDto[]>>(`${this.apiUrl}/list`);
  }

  // ─── Crear ────────────────────────────────────────────────
  create(dto: CreateCategoriaDto): Observable<ResponseModel<CategoriaModel>> {
    return this.http.post<ResponseModel<CategoriaModel>>(this.apiUrl, dto);
  }

  // ─── Actualizar ───────────────────────────────────────────
  update(
    id: number,
    dto: UpdateCategoriaDto,
  ): Observable<ResponseModel<CategoriaModel>> {
    return this.http.put<ResponseModel<CategoriaModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  // ─── Eliminar ─────────────────────────────────────────────
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
