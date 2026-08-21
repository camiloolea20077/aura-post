import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SupervisionRetroactivaModel } from '../models/supervision-retroactiva.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/** Qué entró a las cajas sin ser del turno, en un período. */
@Injectable({ providedIn: 'root' })
export class SupervisionRetroactivaService {
  private readonly api = `${environment.apiUrl}caja/supervision-retroactiva`;

  constructor(private readonly http: HttpClient) {}

  /** Sin fechas, el backend devuelve el mes en curso. */
  listar(
    desde?: string,
    hasta?: string,
  ): Observable<ResponseModel<SupervisionRetroactivaModel>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<SupervisionRetroactivaModel>>(this.api, {
      params,
    });
  }
}
