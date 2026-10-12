import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CreateTipoComprobanteDto,
  FiltroPagina,
  PaginaModel,
  TipoComprobanteModel,
} from '../models/nomina-parametros.model';

/**
 * Tipos de comprobante de nómina (nómina periódica, prima, cesantías,
 * liquidación definitiva…): clase, prefijo y empleados que admite.
 *
 * Backend: `NominaTipoComprobanteController` → `/api/nomina/tipos-comprobante`
 */
@Injectable({ providedIn: 'root' })
export class NominaTipoComprobanteService {
  private readonly base = `${environment.apiUrl}nomina/tipos-comprobante`;

  constructor(private readonly http: HttpClient) {}

  /** Listado paginado; la primera vez el back siembra los tipos iniciales. */
  page(filtro: FiltroPagina): Observable<ResponseModel<PaginaModel<TipoComprobanteModel>>> {
    return this.http.post<ResponseModel<PaginaModel<TipoComprobanteModel>>>(`${this.base}/page`, filtro);
  }

  activos(): Observable<ResponseModel<TipoComprobanteModel[]>> {
    return this.http.get<ResponseModel<TipoComprobanteModel[]>>(`${this.base}/list`);
  }

  crear(dto: CreateTipoComprobanteDto): Observable<ResponseModel<TipoComprobanteModel>> {
    return this.http.post<ResponseModel<TipoComprobanteModel>>(this.base, dto);
  }

  actualizar(id: number, dto: CreateTipoComprobanteDto): Observable<ResponseModel<TipoComprobanteModel>> {
    return this.http.put<ResponseModel<TipoComprobanteModel>>(`${this.base}/${id}`, dto);
  }

  eliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.base}/${id}`);
  }
}
