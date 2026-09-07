import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ReporteCarteraDocumentoModel,
  ReporteCarteraFiltroDto,
  ReporteCarteraResumenModel,
} from '../models/reporte-cartera.model';

/**
 * Estado de cuenta de cartera. Los mismos endpoints sirven a clientes y
 * proveedores: `tipo` decide de cuál se trata.
 */
@Injectable({ providedIn: 'root' })
export class ReporteCarteraService {
  private readonly base = `${environment.apiUrl}reportes/cartera`;

  constructor(private readonly http: HttpClient) {}

  resumen(
    filtro: ReporteCarteraFiltroDto,
  ): Observable<ResponseModel<ReporteCarteraResumenModel>> {
    return this.http.post<ResponseModel<ReporteCarteraResumenModel>>(
      `${this.base}/resumen`,
      filtro,
    );
  }

  documentos(filtro: ReporteCarteraFiltroDto): Observable<
    ResponseModel<{
      content: ReporteCarteraDocumentoModel[];
      totalElements: number;
    }>
  > {
    return this.http.post<any>(`${this.base}/documentos`, filtro);
  }

  excelResumen(filtro: ReporteCarteraFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}/excel`, filtro, {
      responseType: 'blob',
    });
  }

  excelDetalle(filtro: ReporteCarteraFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}/detalle/excel`, filtro, {
      responseType: 'blob',
    });
  }
}
