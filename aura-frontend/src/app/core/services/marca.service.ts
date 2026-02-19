import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MarcaModel,
  MarcaTableModel,
  CreateMarcaDto,
  UpdateMarcaDto,
  MarcaFilterParams,
} from '../models/marca.model';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { environment } from '../../../environments/environment';
import { IFilterTable } from '../../shared/utils/filter-table';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private readonly apiUrl = `${environment.apiUrl}marcas`;

  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<MarcaFilterParams>,
  ): Observable<ResponseTableModel<MarcaTableModel>> {
    return this.http.post<ResponseTableModel<MarcaTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }

  getById(id: number): Observable<ResponseModel<MarcaModel>> {
    return this.http.get<ResponseModel<MarcaModel>>(`${this.apiUrl}/${id}`);
  }

  list(): Observable<ResponseModel<MarcaTableModel[]>> {
    return this.http.get<ResponseModel<MarcaTableModel[]>>(
      `${this.apiUrl}/list`,
    );
  }

  create(dto: CreateMarcaDto): Observable<ResponseModel<MarcaModel>> {
    return this.http.post<ResponseModel<MarcaModel>>(this.apiUrl, dto);
  }

  update(
    id: number,
    dto: UpdateMarcaDto,
  ): Observable<ResponseModel<MarcaModel>> {
    return this.http.put<ResponseModel<MarcaModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
