import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { BorradorDeclaracionModel } from '../models/declaraciones.model';

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
}
