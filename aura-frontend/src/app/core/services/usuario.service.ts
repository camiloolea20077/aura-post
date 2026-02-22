import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UsuarioFilterParams,
  UsuarioModel,
  UsuarioTableModel,
} from '../models/usuario.model';
import { environment } from '../../../environments/environment';
import { IFilterTable } from '../../shared/utils/filter-table';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}usuarios`;

  constructor(private readonly http: HttpClient) {}

  // ─── Paginado (tabla lazy) ────────────────────────────────
  page(
    filter: IFilterTable<UsuarioFilterParams>,
  ): Observable<ResponseTableModel<UsuarioTableModel>> {
    return this.http.post<ResponseTableModel<UsuarioTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  // ─── Por ID ───────────────────────────────────────────────
  getById(id: number): Observable<ResponseModel<UsuarioModel>> {
    return this.http.get<ResponseModel<UsuarioModel>>(`${this.apiUrl}/${id}`);
  }

  // ─── Crear ────────────────────────────────────────────────
  create(dto: CreateUsuarioDto): Observable<ResponseModel<UsuarioModel>> {
    return this.http.post<ResponseModel<UsuarioModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  // ─── Actualizar ───────────────────────────────────────────
  update(
    id: number,
    dto: UpdateUsuarioDto,
  ): Observable<ResponseModel<UsuarioModel>> {
    return this.http.put<ResponseModel<UsuarioModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  // ─── Desactivar ───────────────────────────────────────────
  desactivar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
