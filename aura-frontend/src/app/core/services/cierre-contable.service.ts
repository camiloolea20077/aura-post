import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { CierreContableDto, ReporteIvaDto } from '../models/cierre-contable.model';

@Injectable({ providedIn: 'root' })
export class CierreContableService {
  private readonly apiUrl = `${environment.apiUrl}cierre-contable`;

  constructor(private readonly http: HttpClient) {}

  obtener(fechaDesde: string, fechaHasta: string): Observable<ResponseModel<CierreContableDto>> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);
    return this.http.get<ResponseModel<CierreContableDto>>(this.apiUrl, { params });
  }

  reporteIva(fechaDesde: string, fechaHasta: string): Observable<ResponseModel<ReporteIvaDto>> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);
    return this.http.get<ResponseModel<ReporteIvaDto>>(`${this.apiUrl}/reporte-iva`, { params });
  }
}
