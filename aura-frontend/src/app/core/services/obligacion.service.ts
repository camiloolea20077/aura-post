import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateObligacionDto,
  CuotaAmortizacionModel,
  ObligacionModel,
} from '../models/obligacion.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ObligacionService {
  private readonly apiUrl = `${environment.apiUrl}obligaciones-financieras`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<ObligacionModel[]>> {
    return this.http.get<ResponseModel<ObligacionModel[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ResponseModel<ObligacionModel>> {
    return this.http.get<ResponseModel<ObligacionModel>>(`${this.apiUrl}/${id}`);
  }

  crear(dto: CreateObligacionDto): Observable<ResponseModel<ObligacionModel>> {
    return this.http.post<ResponseModel<ObligacionModel>>(this.apiUrl, dto);
  }

  pagarCuota(
    obligacionId: number,
    cuotaId: number,
  ): Observable<ResponseModel<CuotaAmortizacionModel>> {
    return this.http.post<ResponseModel<CuotaAmortizacionModel>>(
      `${this.apiUrl}/${obligacionId}/cuotas/${cuotaId}/pagar`,
      {},
    );
  }

  anular(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
