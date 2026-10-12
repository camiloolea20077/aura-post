import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import {
  CausacionCalculo,
  CausacionCrear,
  CausacionDetalle,
  CausacionFila,
  CausacionFiltro,
} from '../models/causacion-gasto.model';

/** Causación de gastos y servicios (`/api/causaciones-gasto`). */
@Injectable({ providedIn: 'root' })
export class CausacionGastoService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}causaciones-gasto`;

  page(dto: {
    page: number;
    rows: number;
    search?: string | null;
    params?: CausacionFiltro;
  }): Observable<ResponseTableModel<CausacionFila>> {
    return this.http.post<ResponseTableModel<CausacionFila>>(`${this.api}/page`, dto);
  }

  /** IVA, retenciones y neto sin grabar. */
  calcular(dto: CausacionCrear): Observable<ResponseModel<CausacionCalculo>> {
    return this.http.post<ResponseModel<CausacionCalculo>>(`${this.api}/calcular`, dto);
  }

  crear(dto: CausacionCrear): Observable<ResponseModel<CausacionDetalle>> {
    return this.http.post<ResponseModel<CausacionDetalle>>(this.api, dto);
  }

  getById(id: number): Observable<ResponseModel<CausacionDetalle>> {
    return this.http.get<ResponseModel<CausacionDetalle>>(`${this.api}/${id}`);
  }

  anular(id: number, motivo: string): Observable<ResponseModel<CausacionDetalle>> {
    return this.http.patch<ResponseModel<CausacionDetalle>>(`${this.api}/${id}/anular`, { motivo });
  }
}
