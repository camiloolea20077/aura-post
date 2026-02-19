import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DashboardDto,
  MetodoPagoDto,
  VentasSemanaDto,
} from '../models/dashboard.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}dashboard`;

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<ResponseModel<DashboardDto>> {
    return this.http.get<ResponseModel<DashboardDto>>(this.apiUrl);
  }

  ventasSemana(): Observable<ResponseModel<VentasSemanaDto[]>> {
    return this.http.get<ResponseModel<VentasSemanaDto[]>>(
      `${this.apiUrl}/ventas-semana`
    );
  }

  ventasMetodoPago(): Observable<ResponseModel<MetodoPagoDto[]>> {
    return this.http.get<ResponseModel<MetodoPagoDto[]>>(
      `${this.apiUrl}/ventas-metodo-pago`
    );
  }
}