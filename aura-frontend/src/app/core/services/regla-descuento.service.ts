import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ReglaDescuentoModel,
  ReglaDescuentoTableModel,
  CreateReglaDescuentoDto,
  UpdateReglaDescuentoDto,
  DescuentoPageableDto,
} from '../models/regla-descuento.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ReglaDescuentoService {
  private readonly apiUrl = `${environment.apiUrl}descuentos`;

  constructor(private readonly http: HttpClient) {}

  page(
    dto: DescuentoPageableDto,
  ): Observable<ResponseTableModel<ReglaDescuentoTableModel>> {
    return this.http.post<ResponseTableModel<ReglaDescuentoTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<ReglaDescuentoModel>> {
    return this.http.get<ResponseModel<ReglaDescuentoModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(
    dto: CreateReglaDescuentoDto,
  ): Observable<ResponseModel<ReglaDescuentoModel>> {
    return this.http.post<ResponseModel<ReglaDescuentoModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateReglaDescuentoDto,
  ): Observable<ResponseModel<ReglaDescuentoModel>> {
    return this.http.put<ResponseModel<ReglaDescuentoModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
