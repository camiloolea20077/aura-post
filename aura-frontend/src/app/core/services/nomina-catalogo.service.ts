import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CreateNominaCatalogoDto,
  FiltroPagina,
  NominaCatalogoModel,
  PaginaModel,
  TipoCatalogoNominaModel,
} from '../models/nomina-parametros.model';

/**
 * Catálogos simples de nómina (grupos, niveles y tipos de cargo, tipos de
 * embargo, motivos de retiro y de ausentismo, riesgos ARL).
 *
 * Backend: `NominaCatalogoController` → `/api/nomina/catalogos/{catalogo}`,
 * donde `catalogo` es la ruta del catálogo (p. ej. `tipos-embargo`).
 */
@Injectable({ providedIn: 'root' })
export class NominaCatalogoService {
  private readonly base = `${environment.apiUrl}nomina/catalogos`;

  constructor(private readonly http: HttpClient) {}

  /** Definición del catálogo: título, descripción y campos propios. */
  tipo(catalogo: string): Observable<ResponseModel<TipoCatalogoNominaModel>> {
    return this.http.get<ResponseModel<TipoCatalogoNominaModel>>(`${this.base}/${catalogo}/tipo`);
  }

  /** Listado paginado; la primera vez el back siembra los valores iniciales. */
  page(catalogo: string, filtro: FiltroPagina): Observable<ResponseModel<PaginaModel<NominaCatalogoModel>>> {
    return this.http.post<ResponseModel<PaginaModel<NominaCatalogoModel>>>(`${this.base}/${catalogo}/page`, filtro);
  }

  /** Elementos activos, para selects de otras pantallas. */
  activos(catalogo: string): Observable<ResponseModel<NominaCatalogoModel[]>> {
    return this.http.get<ResponseModel<NominaCatalogoModel[]>>(`${this.base}/${catalogo}/list`);
  }

  crear(catalogo: string, dto: CreateNominaCatalogoDto): Observable<ResponseModel<NominaCatalogoModel>> {
    return this.http.post<ResponseModel<NominaCatalogoModel>>(`${this.base}/${catalogo}`, dto);
  }

  actualizar(catalogo: string, id: number, dto: CreateNominaCatalogoDto): Observable<ResponseModel<NominaCatalogoModel>> {
    return this.http.put<ResponseModel<NominaCatalogoModel>>(`${this.base}/${catalogo}/${id}`, dto);
  }

  /** Borrado lógico; 409 si un cargo usa el elemento. */
  eliminar(catalogo: string, id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.base}/${catalogo}/${id}`);
  }
}
