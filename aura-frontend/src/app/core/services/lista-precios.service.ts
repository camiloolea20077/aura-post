import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ListaPreciosModel,
  ListaPreciosTableModel,
  CreateListaPreciosDto,
  UpdateListaPreciosDto,
  ListaPreciosPageableDto,
} from '../models/lista-precios.model';

import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ListaPreciosService {
  private readonly apiUrl = `${environment.apiUrl}listas-precios`;

  constructor(private readonly http: HttpClient) {}

  page(
    dto: ListaPreciosPageableDto,
  ): Observable<ResponseTableModel<ListaPreciosTableModel>> {
    return this.http.post<ResponseTableModel<ListaPreciosTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<ListaPreciosModel>> {
    return this.http.get<ResponseModel<ListaPreciosModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  // Para dropdown en producto-precio
  list(): Observable<ResponseModel<ListaPreciosTableModel[]>> {
    return this.http.get<ResponseModel<ListaPreciosTableModel[]>>(
      `${this.apiUrl}/list`,
    );
  }

  create(
    dto: CreateListaPreciosDto,
  ): Observable<ResponseModel<ListaPreciosModel>> {
    return this.http.post<ResponseModel<ListaPreciosModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateListaPreciosDto,
  ): Observable<ResponseModel<ListaPreciosModel>> {
    return this.http.put<ResponseModel<ListaPreciosModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
