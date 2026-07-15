import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CambioPatrimonioLinea,
  FlujoEfectivoModel,
} from '../models/eeff.model';

/** E10 · Estados financieros NIIF — /api/contabilidad/eeff */
@Injectable({ providedIn: 'root' })
export class EeffService {
  private readonly api = `${environment.apiUrl}contabilidad/eeff`;

  constructor(private readonly http: HttpClient) {}

  cambiosPatrimonio(
    desde: string,
    hasta: string,
  ): Observable<ResponseModel<CambioPatrimonioLinea[]>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResponseModel<CambioPatrimonioLinea[]>>(
      `${this.api}/cambios-patrimonio`,
      { params },
    );
  }

  flujoEfectivo(
    desde: string,
    hasta: string,
  ): Observable<ResponseModel<FlujoEfectivoModel>> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResponseModel<FlujoEfectivoModel>>(
      `${this.api}/flujo-efectivo`,
      { params },
    );
  }
}
