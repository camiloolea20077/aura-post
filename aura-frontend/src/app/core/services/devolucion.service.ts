import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateDevolucionDto,
  DevolucionModel,
  DevolucionPageableDto,
  DevolucionTableModel,
} from '../models/devolucion.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class DevolucionService {
  private readonly apiUrl = `${environment.apiUrl}devoluciones`;

  constructor(private readonly http: HttpClient) {}

  page(dto: DevolucionPageableDto): Observable<ResponseTableModel<DevolucionTableModel>> {
    return this.http.post<ResponseTableModel<DevolucionTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<DevolucionModel>> {
    return this.http.get<ResponseModel<DevolucionModel>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDevolucionDto): Observable<ResponseModel<DevolucionModel>> {
    return this.http.post<ResponseModel<DevolucionModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  anular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(
      `${this.apiUrl}/${id}/anular`,
      {},
    );
  }
}
