import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ActaCierreModel,
  ChequeoCierreModel,
  ComparativoModel,
  ResultadoAjusteModel,
} from '../models/cierre-mes.model';

/** Cierre de mes: lista de chequeo, ajustes asistidos, acta y comparativos. */
@Injectable({ providedIn: 'root' })
export class CierreMesService {
  private readonly baseUrl = `${environment.apiUrl}periodos-contables`;

  constructor(private readonly http: HttpClient) {}

  chequeo(periodoId: number): Observable<ResponseModel<ChequeoCierreModel>> {
    return this.http.get<ResponseModel<ChequeoCierreModel>>(`${this.baseUrl}/${periodoId}/chequeo`);
  }

  /** tipo = depreciacion | diferidos | deterioro */
  ajustar(periodoId: number, tipo: string): Observable<ResponseModel<ResultadoAjusteModel>> {
    return this.http.post<ResponseModel<ResultadoAjusteModel>>(`${this.baseUrl}/${periodoId}/ajustes/${tipo}`, {});
  }

  acta(periodoId: number): Observable<ResponseModel<ActaCierreModel>> {
    return this.http.get<ResponseModel<ActaCierreModel>>(`${this.baseUrl}/${periodoId}/acta`);
  }

  comparativo(periodoId: number): Observable<ResponseModel<ComparativoModel>> {
    return this.http.get<ResponseModel<ComparativoModel>>(`${this.baseUrl}/${periodoId}/comparativo`);
  }
}
