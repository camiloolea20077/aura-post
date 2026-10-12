import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  BorradorDeclaracionModel,
  ParametrosIca,
  PorPagarDeclaracion,
  RegistrarPagoDeclaracionDto,
} from '../models/declaraciones.model';

@Injectable({ providedIn: 'root' })
export class DeclaracionesService {
  private readonly api = `${environment.apiUrl}contabilidad/declaraciones`;

  constructor(private readonly http: HttpClient) {}

  iva(desde: string, hasta: string): Observable<ResponseModel<BorradorDeclaracionModel>> {
    return this.http.get<ResponseModel<BorradorDeclaracionModel>>(`${this.api}/iva`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }

  retencion(desde: string, hasta: string): Observable<ResponseModel<BorradorDeclaracionModel>> {
    return this.http.get<ResponseModel<BorradorDeclaracionModel>>(`${this.api}/retencion`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }

  /** Industria y comercio del municipio (tarifa y deducciones las pone el contador). */
  ica(p: ParametrosIca): Observable<ResponseModel<BorradorDeclaracionModel>> {
    return this.http.post<ResponseModel<BorradorDeclaracionModel>>(`${this.api}/ica`, p);
  }

  /** Causa el ICA: nota contable DB 511505 · CR 2412 a nombre del municipio. */
  causarIca(p: ParametrosIca): Observable<ResponseModel<string>> {
    return this.http.post<ResponseModel<string>>(`${this.api}/ica/causar`, p);
  }

  /** Pago de la declaración a un acreedor: el valor y las cuentas los calcula el servidor. */
  registrarPago(dto: RegistrarPagoDeclaracionDto): Observable<ResponseModel<PorPagarDeclaracion>> {
    return this.http.post<ResponseModel<PorPagarDeclaracion>>(`${this.api}/pagos`, dto);
  }

  anularPago(id: number, motivo: string): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/pagos/${id}/anular`, { motivo });
  }
}
