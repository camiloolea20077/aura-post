import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CreateTipoVinculacionDto,
  FiltroPagina,
  PaginaModel,
  TipoVinculacionModel,
} from '../models/nomina-parametros.model';

/**
 * Tipos de vinculación (planta, fijo, aprendiz, jornal…): agrupan a los
 * empleados y proponen contrato, remuneración y frecuencia al vincular.
 *
 * Backend: `NominaTipoVinculacionController` → `/api/nomina/tipos-vinculacion`
 */
@Injectable({ providedIn: 'root' })
export class NominaTipoVinculacionService {
  private readonly base = `${environment.apiUrl}nomina/tipos-vinculacion`;

  constructor(private readonly http: HttpClient) {}

  /** Listado paginado; la primera vez el back siembra los tipos iniciales. */
  page(filtro: FiltroPagina): Observable<ResponseModel<PaginaModel<TipoVinculacionModel>>> {
    return this.http.post<ResponseModel<PaginaModel<TipoVinculacionModel>>>(`${this.base}/page`, filtro);
  }

  activos(): Observable<ResponseModel<TipoVinculacionModel[]>> {
    return this.http.get<ResponseModel<TipoVinculacionModel[]>>(`${this.base}/list`);
  }

  crear(dto: CreateTipoVinculacionDto): Observable<ResponseModel<TipoVinculacionModel>> {
    return this.http.post<ResponseModel<TipoVinculacionModel>>(this.base, dto);
  }

  actualizar(id: number, dto: CreateTipoVinculacionDto): Observable<ResponseModel<TipoVinculacionModel>> {
    return this.http.put<ResponseModel<TipoVinculacionModel>>(`${this.base}/${id}`, dto);
  }

  eliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.base}/${id}`);
  }
}
