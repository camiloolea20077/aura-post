import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateMovimientoDto, TesoreriaMovimientoModel } from '../models/tesoreria.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class TesoreriaService {
  private readonly api = `${environment.apiUrl}tesoreria`;

  constructor(private readonly http: HttpClient) {}

  listarEgresos(desde: string, hasta: string, cuentaId?: number | null): Observable<ResponseModel<TesoreriaMovimientoModel[]>> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (cuentaId) params = params.set('cuentaId', cuentaId);
    return this.http.get<ResponseModel<TesoreriaMovimientoModel[]>>(`${this.api}/egresos`, { params });
  }

  listarRecaudos(desde: string, hasta: string, cuentaId?: number | null): Observable<ResponseModel<TesoreriaMovimientoModel[]>> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (cuentaId) params = params.set('cuentaId', cuentaId);
    return this.http.get<ResponseModel<TesoreriaMovimientoModel[]>>(`${this.api}/recaudos`, { params });
  }

  crearEgreso(dto: CreateMovimientoDto): Observable<ResponseModel<TesoreriaMovimientoModel>> {
    return this.http.post<ResponseModel<TesoreriaMovimientoModel>>(`${this.api}/egresos`, dto);
  }

  crearRecaudo(dto: CreateMovimientoDto): Observable<ResponseModel<TesoreriaMovimientoModel>> {
    return this.http.post<ResponseModel<TesoreriaMovimientoModel>>(`${this.api}/recaudos`, dto);
  }

  anular(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/movimientos/${id}/anular`, {});
  }

  toggleConciliado(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/movimientos/${id}/conciliar`, {});
  }

  listarConciliacion(cuentaId: number, desde: string, hasta: string): Observable<ResponseModel<TesoreriaMovimientoModel[]>> {
    const params = new HttpParams()
      .set('cuentaId', cuentaId)
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.get<ResponseModel<TesoreriaMovimientoModel[]>>(`${this.api}/conciliacion`, { params });
  }
}
