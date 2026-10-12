import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CreateNominaCargoDto,
  FiltroPagina,
  NominaCargoModel,
  PaginaModel,
} from '../models/nomina-parametros.model';

/**
 * Cargos de la empresa (nivel, tipo, plazas y rango salarial).
 *
 * Backend: `NominaCargoController` → `/api/nomina/cargos`
 */
@Injectable({ providedIn: 'root' })
export class NominaCargoService {
  private readonly base = `${environment.apiUrl}nomina/cargos`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: FiltroPagina): Observable<ResponseModel<PaginaModel<NominaCargoModel>>> {
    return this.http.post<ResponseModel<PaginaModel<NominaCargoModel>>>(`${this.base}/page`, filtro);
  }

  /** Cargos activos para selects (vinculación, filtros). */
  activos(): Observable<ResponseModel<NominaCargoModel[]>> {
    return this.http.get<ResponseModel<NominaCargoModel[]>>(`${this.base}/list`);
  }

  /** Crea un cargo; 400 si el código existe o el rango salarial no cuadra. */
  crear(dto: CreateNominaCargoDto): Observable<ResponseModel<NominaCargoModel>> {
    return this.http.post<ResponseModel<NominaCargoModel>>(this.base, dto);
  }

  actualizar(id: number, dto: CreateNominaCargoDto): Observable<ResponseModel<NominaCargoModel>> {
    return this.http.put<ResponseModel<NominaCargoModel>>(`${this.base}/${id}`, dto);
  }

  eliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.base}/${id}`);
  }
}
