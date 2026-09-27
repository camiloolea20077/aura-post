import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  FiltroAuxiliar,
  LibroAuxiliarModel,
  LibroDiarioModel,
} from '../models/libros-contables.model';

@Injectable({ providedIn: 'root' })
export class LibrosContablesService {
  private readonly api = `${environment.apiUrl}contabilidad/libros`;

  constructor(private readonly http: HttpClient) {}

  auxiliarTercero(f: FiltroAuxiliar): Observable<ResponseModel<LibroAuxiliarModel>> {
    let params = new HttpParams().set('desde', f.desde).set('hasta', f.hasta);
    if (f.cuentaDesde) params = params.set('cuentaDesde', f.cuentaDesde);
    if (f.cuentaHasta) params = params.set('cuentaHasta', f.cuentaHasta);
    if (f.terceroId != null) params = params.set('terceroId', f.terceroId);
    return this.http.get<ResponseModel<LibroAuxiliarModel>>(
      `${this.api}/auxiliar-tercero`,
      { params },
    );
  }

  diario(desde: string, hasta: string): Observable<ResponseModel<LibroDiarioModel>> {
    return this.http.get<ResponseModel<LibroDiarioModel>>(`${this.api}/diario`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }
}
