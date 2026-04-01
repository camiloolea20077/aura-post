import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ComprobanteCajaModel,
  ComprobanteCajaPageableDto,
} from '../models/comprobante-caja.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

export interface ComprobanteCajaListResponse {
  status: number;
  message: string;
  error: boolean;
  data: ComprobanteCajaModel[];
}

@Injectable({ providedIn: 'root' })
export class ComprobanteCajaService {
  private readonly apiUrl = `${environment.apiUrl}comprobantes-caja`;

  constructor(private readonly http: HttpClient) {}

  listar(dto: ComprobanteCajaPageableDto): Observable<ComprobanteCajaListResponse> {
    let params = new HttpParams()
      .set('page', dto.page.toString())
      .set('rows', dto.rows.toString());

    if (dto.tipo) params = params.set('tipo', dto.tipo);
    if (dto.desde) params = params.set('desde', dto.desde);
    if (dto.hasta) params = params.set('hasta', dto.hasta);

    return this.http.get<ComprobanteCajaListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ResponseModel<ComprobanteCajaModel>> {
    return this.http.get<ResponseModel<ComprobanteCajaModel>>(`${this.apiUrl}/${id}`);
  }
}
