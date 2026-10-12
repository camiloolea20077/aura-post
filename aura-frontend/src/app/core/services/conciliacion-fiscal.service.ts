import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ConciliacionAjuste,
  ConciliacionCabecera,
  ConciliacionCuenta,
  ConciliacionResumen,
  FormatoFiscal,
  RenglonCatalogo,
  Formulario110,
  Manuales110,
} from '../models/conciliacion-fiscal.model';

/** Conciliación fiscal 2516 / 2517 (`/api/conciliacion-fiscal`). */
@Injectable({ providedIn: 'root' })
export class ConciliacionFiscalService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}conciliacion-fiscal`;

  listar(): Observable<ResponseModel<ConciliacionCabecera[]>> {
    return this.http.get<ResponseModel<ConciliacionCabecera[]>>(this.api);
  }

  renglones(): Observable<ResponseModel<RenglonCatalogo[]>> {
    return this.http.get<ResponseModel<RenglonCatalogo[]>>(`${this.api}/renglones`);
  }

  crear(dto: { anio: number; formato: FormatoFiscal; tarifaRenta: number }): Observable<ResponseModel<ConciliacionCabecera>> {
    return this.http.post<ResponseModel<ConciliacionCabecera>>(this.api, dto);
  }

  obtener(id: number): Observable<ResponseModel<ConciliacionResumen>> {
    return this.http.get<ResponseModel<ConciliacionResumen>>(`${this.api}/${id}`);
  }

  /** Borrador del formulario 110 sobre la conciliación. */
  formulario110(id: number, manuales: Manuales110): Observable<ResponseModel<Formulario110>> {
    return this.http.post<ResponseModel<Formulario110>>(`${this.api}/${id}/formulario-110`, manuales);
  }

  eliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/${id}`);
  }

  tarifa(id: number, tarifaRenta: number): Observable<ResponseModel<ConciliacionCabecera>> {
    return this.http.put<ResponseModel<ConciliacionCabecera>>(`${this.api}/${id}/tarifa`, { tarifaRenta });
  }

  cerrar(id: number): Observable<ResponseModel<ConciliacionCabecera>> {
    return this.http.patch<ResponseModel<ConciliacionCabecera>>(`${this.api}/${id}/cerrar`, {});
  }

  reabrir(id: number): Observable<ResponseModel<ConciliacionCabecera>> {
    return this.http.patch<ResponseModel<ConciliacionCabecera>>(`${this.api}/${id}/reabrir`, {});
  }

  cuentas(id: number): Observable<ResponseModel<ConciliacionCuenta[]>> {
    return this.http.get<ResponseModel<ConciliacionCuenta[]>>(`${this.api}/${id}/cuentas`);
  }

  balanceSistema(id: number): Observable<ResponseModel<ConciliacionResumen>> {
    return this.http.post<ResponseModel<ConciliacionResumen>>(`${this.api}/${id}/balance/sistema`, {});
  }

  reclasificar(id: number, cuentaId: number, renglon: string | null): Observable<ResponseModel<ConciliacionCuenta>> {
    return this.http.put<ResponseModel<ConciliacionCuenta>>(`${this.api}/${id}/cuentas/${cuentaId}/renglon`, { renglon });
  }

  agregarAjuste(id: number, a: ConciliacionAjuste): Observable<ResponseModel<ConciliacionAjuste>> {
    return this.http.post<ResponseModel<ConciliacionAjuste>>(`${this.api}/${id}/ajustes`, a);
  }

  eliminarAjuste(id: number, ajusteId: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/${id}/ajustes/${ajusteId}`);
  }
}
