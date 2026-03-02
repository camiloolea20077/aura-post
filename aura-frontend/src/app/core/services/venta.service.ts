import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  VentaModel,
  VentaTableModel,
  CreateVentaDto,
  VentaPageableDto,
  VentaReporteResponse,
} from '../models/venta.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly apiUrl = `${environment.apiUrl}ventas`;
  constructor(private readonly http: HttpClient) {}

  page(dto: VentaPageableDto): Observable<ResponseTableModel<VentaTableModel>> {
    return this.http.post<ResponseTableModel<VentaTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<VentaModel>> {
    return this.http.get<ResponseModel<VentaModel>>(`${this.apiUrl}/${id}`);
  }
  create(dto: CreateVentaDto): Observable<ResponseModel<VentaModel>> {
    return this.http.post<ResponseModel<VentaModel>>(
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
  generarFacturaElectronica(ventaId: number): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(
      `${this.apiUrl}/${ventaId}/factura-electronica`,
      {},
    );
  }
  getReporte(params: {
    desde?: string; // YYYY-MM-DD
    hasta?: string;
    page?: number;
    rows?: number;
  }): Observable<VentaReporteResponse> {
    let httpParams = new HttpParams();
    if (params.desde) httpParams = httpParams.set('desde', params.desde);
    if (params.hasta) httpParams = httpParams.set('hasta', params.hasta);
    httpParams = httpParams
      .set('page', String(params.page ?? 0))
      .set('rows', String(params.rows ?? 200));

    return this.http.get<VentaReporteResponse>(`${this.apiUrl}reporte`, {
      params: httpParams,
    });
  }

  // ── NUEVO: Descarga PDF de factura electrónica ───────────
  // (ya existe en venta.service.patch.ts anterior — incluido aquí por completitud)
  descargarFacturaPdf(ventaId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${ventaId}/factura-pdf`, {
      responseType: 'blob',
    });
  }
}
