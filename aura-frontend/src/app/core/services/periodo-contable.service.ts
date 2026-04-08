import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AbrirPeriodoDto,
  BalanceComprobacionModel,
  CerrarPeriodoDto,
  PeriodoContableModel,
} from '../models/periodo-contable.model';

@Injectable({ providedIn: 'root' })
export class PeriodoContableService {
  private readonly baseUrl = `${environment.apiUrl}periodos-contables`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<PeriodoContableModel[]>> {
    return this.http.get<ResponseModel<PeriodoContableModel[]>>(this.baseUrl);
  }

  getPeriodoActivo(): Observable<ResponseModel<PeriodoContableModel | null>> {
    return this.http.get<ResponseModel<PeriodoContableModel | null>>(
      `${this.baseUrl}/activo`,
    );
  }

  abrir(dto: AbrirPeriodoDto): Observable<ResponseModel<PeriodoContableModel>> {
    return this.http.post<ResponseModel<PeriodoContableModel>>(
      `${this.baseUrl}/abrir`,
      dto,
    );
  }

  cerrar(
    id: number,
    dto: CerrarPeriodoDto,
  ): Observable<ResponseModel<PeriodoContableModel>> {
    return this.http.put<ResponseModel<PeriodoContableModel>>(
      `${this.baseUrl}/${id}/cerrar`,
      dto,
    );
  }

  balanceComprobacion(
    periodoId: number,
  ): Observable<ResponseModel<BalanceComprobacionModel>> {
    return this.http.get<ResponseModel<BalanceComprobacionModel>>(
      `${this.baseUrl.replace('periodos-contables', 'reportes-contables')}/balance-comprobacion`,
      { params: { periodoId: periodoId.toString() } },
    );
  }
}
